# DAGG Engine Design

## 算法概述

DAGG（Data-driven Analysis of Genotype-to-phenotype Graphs）是一个三阶段因果推断引擎，将基因组突变数据转化为 500+ 维细胞功能活性图谱（Activity Profile of Signaling Pathways, APSP）。

## 算法原理

### 整体架构

```
┌─────────────────────────────────────────────────┐
│                  DAGG Pipeline                   │
├─────────────────────────────────────────────────┤
│  Input: Patient Mutations                       │
│  [{gene, type, impact, vaf}, ...]               │
│                     ↓                           │
│  Stage 1: Genotype Layer                        │
│  compute_mutation_impact()                      │
│  Mutations → Gene-level Impact Scores           │
│                     ↓                           │
│  Stage 2: Pathway Layer                         │
│  propagate_to_pathways()                        │
│  Gene Impacts → Pathway Activities              │
│  (via gene-pathway adjacency matrix)            │
│                     ↓                           │
│  Stage 3: Phenotype Layer                       │
│  aggregate_cell_functions()                     │
│  Pathway Activities → Cell Function Profiles    │
│  (via pathway-function mapping + noise)         │
│                     ↓                           │
│  Output: APSP                                   │
│  {pathway_activities, cell_functions, signature}│
└─────────────────────────────────────────────────┘
```

## Stage 1: Genotype Layer（基因型层）

### 输入
```python
mutations = [
    {"gene": "TP53", "type": "missense", "vaf": 0.45},
    {"gene": "KRAS", "type": "nonsense", "vaf": 0.72},
]
```

### 突变类型权重

不同突变类型对应不同的生物学影响：

| 突变类型 | 权重 | 生物学意义 |
|---------|------|-----------|
| nonsense | 0.90 | 无义突变，蛋白截断 |
| frameshift | 0.85 | 移码突变，蛋白完全失活 |
| amp | 0.80 | 基因扩增（癌基因激活） |
| splice | 0.70 | 剪接位点突变 |
| missense | 0.50 | 错义突变，功能改变 |
| inframe | 0.40 | 框内插入/缺失 |
| del | -0.80 | 基因缺失（抑癌基因失活） |

### 计算逻辑
```python
impact = base_impact × vaf_factor  # VAF 反映克隆性
# 同一基因多个突变取最大绝对影响
```

## Stage 2: Pathway Layer（通路层）

### 基因-通路邻接矩阵

每个基因关联 1-5 个信号通路，影响通过衰减传播：

```python
dampened_impact = impact / (sqrt(n_pathways) + 1)
```

### 归一化

使用 tanh 函数将无界值压缩到 [-1, 1]：

```python
pathway_activity = tanh(raw_activity × 1.5)
```

- 正值表示通路激活
- 负值表示通路抑制
- 接近 0 表示中性

## Stage 3: Phenotype Layer（表型层）

### 通路-细胞功能映射

每个信号通路影响 5-20 个细胞功能指标，总计 500+ 维：

```python
for pw_id, activity in pathway_activities.items():
    for cf_id in pathway_function_matrix[pw_id]:
        cell_functions[cf_id] += activity / n_affected_functions
```

### 受控噪声

添加小量高斯噪声 (σ=0.05) 模拟生物系统的随机性：

```python
noise = N(0, 0.05)
cell_functions[cf_id] = clip(value + noise, -1, 1)
```

## MOA 虚拟试验

### 响应预测模型

基于通路活性分布预测患者对特定 MOA 的响应：

```python
response_prob = 0.3 + variance(activities) × 0.4  # 基础模型

# MOA 特异性调整
if moa_class in ('ICI', 'CAR_T'):
    response_prob += max(0, mean_activity) × 0.2   # 免疫治疗偏好高活性
elif moa_class in ('TKI', 'EGFR', 'ALK', 'BRAF'):
    response_prob += variance × 0.3                  # 靶向治疗偏好高方差
elif moa_class == 'PARP':
    response_prob += 0.1                             # HRD 依赖
```

### 设计原理

- **高通路方差** → 存在可靶向的依赖关系 → 靶向治疗效果好
- **高平均活性** → 免疫微环境活跃 → 免疫治疗效果好
- **PARP 基线** → HRD（同源重组缺陷）背景加分

## 生产环境扩展方向

当前的模拟实现在统计原理上合理，但生产部署需要：

1. **真实因果网络**：从 TCGA/ICGC 等数据库学习和验证基因-通路因果关系
2. **图神经网络**：使用 GNN 建模更复杂的生物学网络拓扑
3. **多组学整合**：整合转录组、蛋白质组、表观组数据
4. **临床验证**：使用真实临床试验数据进行响应预测校准
5. **GPU 加速**：大规模患者队列需要并行计算

## 关键配置

```python
TOTAL_PATIENTS = 2000       # 数字孪生患者数量
TOTAL_PATHWAYS = 500        # 信号通路数量
TOTAL_CELL_FUNCTIONS = 500  # 细胞功能指标维度
MIN_MUTATIONS = 5           # 每患者最少突变数
MAX_MUTATIONS = 50          # 每患者最多突变数
```
