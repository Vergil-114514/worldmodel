#!/usr/bin/env bash
# 重新拉取 Cosmos3-Edge 权重到 staging/（该目录已被 .gitignore 排除，不进版本库）
# 权重许可: OpenMDW 1.1 —— 仅本地学习使用，不要提交或再分发
set -euo pipefail

REPO_ID="nvidia/Cosmos3-Edge"
TARGET="staging/Cosmos3-Edge"

cd "$(dirname "$0")/.."
mkdir -p "$(dirname "$TARGET")"

if command -v hf >/dev/null 2>&1; then
  hf download "$REPO_ID" --local-dir "$TARGET"
elif python -c "import huggingface_hub" >/dev/null 2>&1; then
  python -m huggingface_hub.commands.huggingface_cli download \
    "$REPO_ID" --local-dir "$TARGET"
else
  echo "未找到 hf CLI。先装一下（conda 环境里）：" >&2
  echo "  pip install -U huggingface_hub" >&2
  exit 1
fi

echo "完成：权重已就绪于 $TARGET（约 8.6 GB，勿提交）"
