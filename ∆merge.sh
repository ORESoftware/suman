#!/usr/bin/env bash

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "rebase_branch" ]]; then
    echo 'Aborting script because you are on rebase_branch branch.';
    exit 1;
fi

# TODO, use node --check to ensure good merges, etc
#(./test/testsrc/shell/node-c.sh && echo "compiled successfully")
# ./node_modules/.bin/ncf --rt $(dirname "$0") --np=**/test/** --np=**/node_modules/** --v 3 --c=8

NEW_BRANCH=merge_this_branch_with_dev_$(node -e 'console.log(Date.now())')

git add . &&
git add -A &&
git commit --allow-empty -am "final commit before rebase 1" &&
git push &&
git fetch origin &&
git checkout dev &&
git add . &&
git add -A &&
git commit --allow-empty -am "final commit before rebase 2" &&
git pull &&
git add . &&
git add -A &&
git commit --allow-empty -am "final commit before rebase 3" &&
git checkout ${BRANCH} &&
git branch -D copy_branch &&
git checkout -b copy_branch &&
git checkout ${BRANCH} &&
git add -all &&
#git clean -f &&
#git clean -f -d &&
#git reset --hard HEAD &&  # this gets rid of untracked files somehow?
echo "now running reset --soft"
git reset --soft dev &&
echo "successfully called reset soft"
git add . &&
git add -A &&
git commit --allow-empty -am "reset:sft" &&
git checkout -b ${NEW_BRANCH} &&
git add . &&
git add -A &&
git commit --allow-empty -am "reset:sft" &&
git push -u origin ${NEW_BRANCH} &&
#git clean -f &&
#git clean -f -d &&
#git reset --hard HEAD &&  # this gets rid of untracked files somehow?
git checkout ${BRANCH} -f &&
git branch -D ${NEW_BRANCH} &&
#git merge dev &&
echo "successfully pushed"
