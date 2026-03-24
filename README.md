# Vender Blender

> Generate sketchy venn diagrams from simple URL params.

### [venn.threejjjs.xyz](https://venn.threejjjs.xyz/)


## Quick Start (Local)

```bash
pnpm install
pnpm dev
```

Visit `http://localhost:5173` to see the demo.

## Deploy to Netlify

```bash
pnpm install
pnpm build
netlify deploy --prod
```

Or connect your GitHub repository to Netlify for automatic deployments.

### Netlify Configuration

The `netlify.toml` file is configured to:
- Build using Vite
- Output serverless functions to `functions/`
- Redirect all requests to the serverless function

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/svg/<sets>` | Returns SVG |
| `/png/<sets>` | Returns PNG |
| `/img-svg/<sets>` | SVG for `<img>` tags |

## Syntax

- **Circle labels**: Use `-` for spaces (e.g., `MY-TITLE`)
- **`.`**: Separate sets within a diagram (1-3 sets)
- **`~label~`**: Intersection label between circles
- **`_label_`**: Universal set (super intersection)
- **`/`**: Separate multiple diagrams

## Examples

### Single Set
```
/svg/MY-SET
```

### Two Sets
```
/svg/APPLES.ORANGES
```

### Two Sets + Intersection
```
/svg/FRUIT.~SWEET-SOUR~.YUM
```

### Three Sets + Intersections + Universal
```
/svg/A.~AB~.B.~BC~.C.~CA~._ALL_
```

### Multiple Diagrams
```
/svg/A.B/C.D
```

## Embedding

```html
<!-- SVG iframe -->
<iframe src="https://venn.threejjjs.xyz/svg/YOUR-SETS"></iframe>

<!-- PNG img tag -->
<img src="https://venn.threejjjs.xyz/png/YOUR-SETS" />

<!-- SVG img tag -->
<img src="https://venn.threejjjs.xyz/img-svg/YOUR-SETS" />
```

## Tech Stack

- [Hono](https://hono.dev/) - Web framework
- [roughjs](https://roughjs.com/) - Sketchy rendering
- [sharp](https://sharp.pixelplumbing.com/) - PNG conversion

## License

ISC
