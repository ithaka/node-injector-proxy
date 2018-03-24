## Injected JS

This URL is hardcoded in `/routes/index.js`

## Add your Sagoku remotes
```bash
git remote add test git@git.test.cirrostratus.org:repos/understanding-proxy.git
git remote add prod git@git.prod.cirrostratus.org:repos/understanding-proxy.git
```

## Docker deployment

- Build the node-injector-proxy container

```bash
docker build -t node-injector-proxy .
```

- Tag and push the container

```bash
docker tag node-injector-proxy docker-registry.acorn.cirrostratus.org/playground/node-injector-proxy:<container-hash>
docker push docker-registry.acorn.cirrostratus.org/playground/node-injector-proxy:<container-hash>
```
- Update the container hash in `docker-compose.yml`
- Commit and push to GitHub
- Commit and push to Sagoku
