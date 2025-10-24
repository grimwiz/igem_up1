# IGEM/UP/1 Testing & Purging Procedure Builder

This project provides a browser-based assistant for drafting testing and purging procedures that align with IGEM/UP/1 good practice. The application guides users through all required sections, stores progress in the browser, and allows exporting the captured data for record keeping.

## Algorithm Overview

The single-page app uses a lightweight client-side workflow:

1. **Structured data capture** – Each section of IGEM/UP/1 (planning, documentation, system data, purge plan, risk assessment, and acceptance) is represented as an HTML form with stable element identifiers. The identifiers double as keys in the saved data structure.
2. **State persistence** – An event listener attaches to every input (`text`, `number`, `date`, `checkbox`, `textarea`, and `select`). On change, the script serialises the entire form state to JSON and saves it in `localStorage` under the `igem-up1-procedure` key. On load, the saved JSON is parsed and rehydrates the interface.
3. **Procedure export** – When the user selects **Download JSON**, the app collects the same keyed dataset, serialises it with indentation, and streams it to the browser as a downloadable `igem-up1-procedure.json` file. Alternatively, the **Print / Save as PDF** button calls `window.print()` so the browser can generate a styled PDF record.
4. **Progressive enhancement** – If the browser does not support `localStorage`, the application still works as a standard form, albeit without persistence.

## Source Material

The layout of the sections, terminology, and control questions in this tool were modelled from the following public references:

- IGEM – IGEM/UP/1 Edition 3: *Strength testing, tightness testing and direct purging of gas installations* (summary and table of contents). [https://www.igem.org.uk/technical-services/standards/igem-up-1/](https://www.igem.org.uk/technical-services/standards/igem-up-1/)
- UK HSE – Gas safety guidance for strength testing and purging operations. [https://www.hse.gov.uk/gas/engineering/testing-purging.htm](https://www.hse.gov.uk/gas/engineering/testing-purging.htm)
- Institution of Gas Engineers & Managers (IGEM) training outlines for gas network procedures. [https://www.igem.org.uk/training-and-events/training/](https://www.igem.org.uk/training-and-events/training/)

These sources informed the procedural sequence, terminology, and checklist prompts embedded in the application.

## Hosting on a Proxmox LXC (Debian 13)

The site is static HTML/CSS/JS, so a minimal Nginx server is sufficient. The steps below assume you are logged into the Proxmox host.

1. **Create the container**
   ```bash
   pct create 123 local:vztmpl/debian-13-standard_13.0-1_amd64.tar.zst      --hostname igem-up1 --memory 512 --cores 1 --net0 name=eth0,bridge=vmbr0,ip=dhcp --rootfs local-lvm:8
   pct start 123
   pct enter 123
   ```

2. **Install the required packages inside the container**
   ```bash
   apt update
   apt install --yes nginx git rsync
   ```

3. **Deploy the web application from your home directory**
   ```bash
   cd ~
   git clone https://github.com/grimwiz/igem_ip1.git
   rsync -av --delete igem_ip1/ /var/www/html/
   chown -R www-data:www-data /var/www/html
   apt purge --yes git
   apt autoremove --yes
   ```

   Cloning into your home directory keeps `/var/www` reserved for the served artefacts only. Removing `git` afterwards trims the container attack surface once deployment is complete.

4. **Harden Nginx with the provided security profile** – The repository ships with [`nginx/default.conf`](nginx/default.conf) which enables a strict Content Security Policy, referrer and permissions policies, disables MIME sniffing, and blocks clickjacking. Install it and reload Nginx:
   ```bash
   cp ~/igem_ip1/nginx/default.conf /etc/nginx/conf.d/igem-up1.conf
   nginx -t
   systemctl reload nginx
   ```

5. **Exit the container**
   ```bash
   exit
   ```

With DHCP enabled, the container obtains an IP address from your LAN. Browse to `http://<container-ip>/` to use the tool.
## Packaging as a Standalone (Installable) Web App

Because the project is static, you can ship it as a Progressive Web App (PWA) so users can “install” it to their phone home screen and run it offline.

1. **Manifest** – `manifest.webmanifest` declares an explicit `id`, `scope`, and the correct `start_url` so Android can detect installability. The icon assets are embedded as base64 data URIs (including a maskable variant) to avoid shipping standalone binaries while still satisfying PWA requirements.
2. **Service worker** – `sw.js` precaches the HTML, CSS, JavaScript, and manifest, cleans up older caches, and falls back to cached content when offline. Registration now happens from `app.js`, keeping inline scripts out of the HTML for stricter security policies.
3. **Installable icons** – Link the manifest from `index.html`; the embedded data URIs mean no additional files are required, yet Android Chrome will still surface an “Install app” banner because the icons satisfy size and maskable requirements.
4. **Security context** – Installation prompts only appear on secure origins. Combine HTTPS with the provided Content Security Policy meta tag (and matching response headers) so the browser trusts the app shell.
5. **Test installation flows** – Use Chrome DevTools → *Application* → *Manifest* to verify all requirements are satisfied. On Android Chrome you should now see an *Install IGEM/UP/1 process builder* menu item; on desktop Chromium the omnibox install icon remains available.

> **Note:** Keep the data URI icons in place—earlier inline work removed the need for PNG files and avoids binary diffs in future pull requests.

Once these steps are complete, the app runs offline using cached assets while continuing to store form progress in `localStorage`.
## Security Hardening Checklist

The application is designed to withstand common OWASP Top 10 risks for static sites:

- **Strict Content Security Policy** – Inline scripts and styles were moved into `app.js` and `styles.css` so the page can enforce `script-src 'self'` and `style-src 'self'` without allowing unsafe inline code. Combined with the Nginx headers, this blocks reflected/stored XSS vectors.
- **Robust headers** – `nginx/default.conf` applies `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and cross-origin isolation headers to mitigate clickjacking, MIME sniffing, and data exfiltration.
- **Scoped service worker caching** – `sw.js` pins cache keys with a versioned prefix, validates response status before caching, and falls back to known-good assets. Navigation requests degrade to the cached app shell so offline support does not introduce request smuggling.
- **Input handling** – User-supplied values are stored locally and never interpolated into the DOM without numeric coercion, protecting against injection. The import routine validates that uploaded JSON is an object before applying it.
- **Least-privilege container** – The Docker image runs Nginx as the unprivileged `nginx` user on port 8080 and only contains the static artefacts plus the hardened config.

## Docker Deployment (minimal footprint)

Build and run the container locally without installing a full web stack:

```bash
docker build -t igem-up1 .
docker run --rm -p 8080:8080 igem-up1
```

The Dockerfile uses `nginx:alpine`, copies only the required static files, and relies on the same security headers described above. Because the container ships with Git removed, no package manager caches, and no separate icon binaries, the resulting image stays compact (<25 MB). Mount a volume at `/usr/share/nginx/html` if you want to override assets at runtime.

## Local Development

To work locally without the container, you can simply open `index.html` in a browser or serve it with any static server (for example, `npx serve`). No build tooling is required.

