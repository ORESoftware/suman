#!/usr/bin/env bash

# GIT_COMMIT_MSG = $1 # first argument to script

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "dev" ]]; then
  echo 'Aborting script because you are not on the right git branch (dev).';
  exit 1;
fi


npm version patch --force -m "Upgrade for several reasons" &&    # bump version
git add . &&
git add -A &&
git commit --allow-empty -am "publish/release:$1" &&
git push &&                                                      # push to private/dev remote repo
git checkout dev_squash2  &&    # we do squashing on this branch
git merge --squash -Xtheirs dev -m "squashing" &&
git add . &&
git add -A &&
git commit --allow-empty -am "publish/release:$1" &&
git checkout -b temp  &&                                          # we checkout this branch to run deletes on private files
./delete-internal-paths.sh &&
git rm delete-internal-paths.sh -f &&
git add . &&
git add -A &&
git commit --allow-empty -am "publish/release:$1" &&
#git rebase $(git describe --tags) &&
git push public HEAD:master -f &&
npm publish . &&
git checkout dev &&
git branch -D temp



