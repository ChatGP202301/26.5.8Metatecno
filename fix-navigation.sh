#!/bin/bash

# 修复俄语版本
sed -i 's|href="/ru"|href="index.html"|g' ru/index.html 2>/dev/null || true
sed -i 's|href="/en"|href="../index.html"|g' ru/index.html 2>/dev/null || true
sed -i 's|href="/fr"|href="../fr/index.html"|g' ru/index.html 2>/dev/null || true
sed -i 's|href="/de"|href="../de/index.html"|g' ru/index.html 2>/dev/null || true
sed -i 's|href="/es"|href="../es/index.html"|g' ru/index.html 2>/dev/null || true

# 修复法语版本
sed -i 's|href="/fr"|href="index.html"|g' fr/index.html 2>/dev/null || true
sed -i 's|href="/en"|href="../index.html"|g' fr/index.html 2>/dev/null || true
sed -i 's|href="/ru"|href="../ru/index.html"|g' fr/index.html 2>/dev/null || true
sed -i 's|href="/de"|href="../de/index.html"|g' fr/index.html 2>/dev/null || true
sed -i 's|href="/es"|href="../es/index.html"|g' fr/index.html 2>/dev/null || true

# 修复德语版本
sed -i 's|href="/de"|href="index.html"|g' de/index.html 2>/dev/null || true
sed -i 's|href="/en"|href="../index.html"|g' de/index.html 2>/dev/null || true
sed -i 's|href="/ru"|href="../ru/index.html"|g' de/index.html 2>/dev/null || true
sed -i 's|href="/fr"|href="../fr/index.html"|g' de/index.html 2>/dev/null || true
sed -i 's|href="/es"|href="../es/index.html"|g' de/index.html 2>/dev/null || true

# 修复西班牙语版本
sed -i 's|href="/es"|href="index.html"|g' es/index.html 2>/dev/null || true
sed -i 's|href="/en"|href="../index.html"|g' es/index.html 2>/dev/null || true
sed-i 's|href="/ru"|href="../ru/index.html"|g' es/index.html 2>/dev/null || true
sed -i 's|href="/fr"|href="../fr/index.html"|g' es/index.html 2>/dev/null || true
sed -i 's|href="/de"|href="../de/index.html"|g' es/index.html 2>/dev/null || true

echo "Navigation fixed!"
