## Injected JS

This URL is hardcoded in `/routes/index.js`

## Docker deployment

### Add the Sagoku remotes for understanding-proxy:

If you haven't already:

```bash
git remote add test git@git.test.cirrostratus.org:repos/understanding-proxy.git
git remote add prod git@git.prod.cirrostratus.org:repos/understanding-proxy.git
```

```bash
# Build the node-injector-proxy container
#
docker build -t node-injector-proxy .  # this will output the container hash at the end
#
# Tag and push the container
#
docker tag node-injector-proxy docker-registry.acorn.cirrostratus.org/playground/node-injector-proxy:<container-hash>
docker push docker-registry.acorn.cirrostratus.org/playground/node-injector-proxy:<container-hash>
#
# Update the container hash in `docker-compose.yml`
# Commit and push to GitHub
# Commit and push to Sagoku
```