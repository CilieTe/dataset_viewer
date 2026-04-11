#!/bin/bash
# 上传脚本 - 手动执行

# 方案1: 使用 SSH (如果配置了SSH密钥)
# git remote set-url origin git@github.com:CilieTe/dataset_viewer.git
# git push -u origin main

# 方案2: 使用 GitHub Desktop 或手动上传
# 1. 下载 dataset_viewer.zip
# 2. 在 GitHub 页面手动上传

# 方案3: 尝试使用代理
# git config --global http.proxy http://proxy:port
# git push -u origin main

echo "请尝试以下方式之一上传代码:"
echo ""
echo "方式1 - 使用SSH (推荐):"
echo "  1. 确保你已配置SSH密钥: ssh-keygen -t ed25519 -C 'your@email.com'"
echo "  2. 添加公钥到GitHub: https://github.com/settings/keys"
echo "  3. 运行: git remote set-url origin git@github.com:CilieTe/dataset_viewer.git"
echo "  4. 运行: git push -u origin main"
echo ""
echo "方式2 - 手动上传:"
echo "  1. 访问: https://github.com/CilieTe/dataset_viewer/upload"
echo "  2. 拖拽上传整个 dataset_viewer-main 文件夹"
echo ""
echo "方式3 - 使用GitHub CLI:"
echo "  1. 运行: gh repo sync CilieTe/dataset_viewer --source ."
