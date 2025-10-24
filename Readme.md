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
   pct create 123 local:vztmpl/debian-13-standard_13.0-1_amd64.tar.zst \
     --hostname igem-up1 --memory 512 --cores 1 --net0 name=eth0,bridge=vmbr0,ip=dhcp --rootfs local-lvm:8
   pct start 123
   pct enter 123
   ```

2. **Install the required packages inside the container**
   ```bash
   apt update
   apt install --yes nginx git
   ```

3. **Deploy the web application**
   ```bash
   cd /var/www
   git clone https://github.com/<your-account>/igem_up1.git
   cp -r igem_up1/* /var/www/html/
   chown -R www-data:www-data /var/www/html
   ```

4. **Adjust Nginx (optional)** – To enforce HTTPS or tweak caching, create `/etc/nginx/sites-available/igem-up1` and symlink it into `sites-enabled`. Reload Nginx once satisfied:
   ```bash
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

1. **Add a web app manifest** – `manifest.webmanifest` in this repository already sets the start URL (`./`), standalone display mode, colour palette, and embeds installable icons as base64 data URIs. Link it from `index.html` with `<link rel="manifest" href="manifest.webmanifest">`.
2. **Register a service worker** – `sw.js` precaches the critical HTML and manifest assets using the Cache API, cleans up older caches, and falls back to cached content when offline. In `index.html`, register it with `navigator.serviceWorker.register('./sw.js')` after checking support.
3. **Provide installable icons** – To avoid shipping binary PNGs in Git, the manifest and service worker embed procedurally generated icons as base64 data URIs and dynamically serve them when browsers request `icon-192.png`, `icon-512.png`, or `apple-touch-icon.png`. If you want to restyle the icon, update the helper in `scripts/generate_icons.py` and re-run it to print replacement data URIs for the manifest, HTML `<link>` tags, and service worker map.
4. **Serve over HTTPS** – Modern browsers only allow installation when the app is served via HTTPS (or from `localhost`). Use Let’s Encrypt on your Nginx host or expose the container behind a reverse proxy that terminates TLS.
5. **Test installation flows** – Use Chrome DevTools → *Application* → *Manifest* to verify all requirements are satisfied. On Android Chrome or iOS Safari (via Web Clips), you should now see an *Add to Home screen* prompt.

Once these steps are complete, the app runs offline using cached assets while continuing to store form progress in `localStorage`.

## Local Development

To work locally without the container, you can simply open `index.html` in a browser or serve it with any static server (for example, `npx serve`). No build tooling is required.

