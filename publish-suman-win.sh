#!/usr/bin/env bash


# (1) on branch dev, checkout a temp branch, git checkout -b temp
# (2) git reset --soft tagname (tagname is from the last time you tagged and should always be the same name for ease of remembering?)
# (3) git commit -am "new serious commit"
# (4) git checkout -b publictemp
# (4) remove private files that do not belong on public/master
# (5) git commit -am "final commit before tagging"
# (6) git tag xyz (does this do a commit too, by default?)
# (7) git push origin master -f
# (8) git checkout dev
# (9) git merge temp....is that it?


#!/usr/bin/env bash

# GIT_COMMIT_MSG = $1 # first argument to script

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "dev" ]]; then
  echo 'Aborting script because you are not on the right git branch (dev).';
  exit 1;
fi

### start of the end ###
npm version patch --force -m "Upgrade for several reasons" &&    # bump version
git add . &&
git add -A &&
git commit --allow-empty -am "publish/release:$1" &&
git push &&                                                      # push to private/dev remote repo
git checkout -b devtemp &&
git reset --soft xyz &&
git add . &&
git add -A &&
git commit -am "publish/release:$1"
git tag xyz &&
git checkout -b temp
./delete-internal-paths.sh &&
git rm delete-internal-paths.sh -f &&
git add . &&
git add -A &&
git commit --allow-empty -am "publish/release:$1" &&
git push public HEAD:master -f &&
git checkout dev &&
git branch -D devtemp &&
npm publish .

