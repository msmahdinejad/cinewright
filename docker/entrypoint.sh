#!/bin/sh
# pcv — thin dispatcher so `docker run … pure-code-video <command>` mirrors the local workflow.
set -e
S=/opt/pure-code-video/scripts
cmd="${1:-doctor}"; [ $# -gt 0 ] && shift
case "$cmd" in
  doctor)   exec node "$S/doctor.mjs" "$@" ;;
  scaffold) exec node "$S/scaffold.mjs" "$@" ;;                       # pcv scaffold /work --template showreel
  atlas)    exec node "$S/atlas.mjs" "$@" ;;
  inspire)  exec node "$S/inspire.mjs" "$@" ;;
  audio)    cd /work && exec node audio.mjs "$@" ;;
  render)   cd /work && exec node tools/render.mjs "$@" ;;
  qc)       cd /work && exec node tools/qc.mjs "$@" ;;
  sh|bash)  exec /bin/sh "$@" ;;
  *)        echo "usage: pcv doctor | scaffold <dir> [opts] | audio | render [opts] | qc [check|energy|…] | atlas … | inspire … | sh" >&2; exit 2 ;;
esac
