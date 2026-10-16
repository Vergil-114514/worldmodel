# 5 Infrastructure

In this section, we describe the integrated infrastructure stack designed to support the end-to-end lifecycle of Cosmos 3. As illustrated in Fig. 11, the platform unified 4 core pillars:

- *Data engineering.* Ingests raw multimodal data and transforms it into curated datasets in the WebDataset format, optimized for scalable, distributed training.

- *Large-scale training.* Maximizes NVIDIA GPU cluster utilization through highly efficient parallelization strategies, optimized data loading, rapid checkpointing, and collective communication primitives.

- *Model serving.* Enables efficient, low-latency deployment and inference execution across both generative and reasoning workloads.

- *Benchmarking & validation.* Provides a unified evaluation framework to assess model capabilities across diverse tasks, enabling automated regression tracking and systematic model comparison.

![Figure 11](figures/tikz_infra_overview.svg)

> Figure 11: **Overview of the Cosmos 3 infrastructure stack. The platform spans four pillars. *Data Infrastructure* ingests raw multimodal streams and curates them into WebDataset-format training shards. *Training Infrastructure* consumes those shards on NVIDIA GPU clusters with efficient parallelization, data loading, and checkpointing. The resulting checkpoints feed two parallel paths (separated by the dashed divider): *Serving Infrastructure* deploys them for low-latency generation and reasoning inference, while *Benchmark Infrastructure* evaluates the same checkpoints against standardized benchmark datasets to track regressions and enable systematic validation.**

## 5.1 Data Infrastructure

The Cosmos 3 training corpus is drawn from tens of billions of image and video candidates spanning diverse modalities, domains, and tasks. Operating at this scale demands a data infrastructure that can simultaneously (1) transform raw multimodal data into training-ready samples through large-scale distributed processing, (2) support embedding-based retrieval, clustering, and deduplication, and (3) enable interactive dataset visualization, inspection, and debugging. To meet these requirements, we developed **SILA** (Scalable Infrastructure for Large-scale data processing and Annotation), a scalable multimodal data infrastructure platform that consolidates storage, metadata management, distributed processing, semantic retrieval, and dataset visualization into a single extensible framework for large-scale data curation and management.

SILA is built around a clean separation between pipeline logic and infrastructure mechanics. Researchers declare typed processing stages—specifying the columns each stage consumes and the outputs it produces—while the platform transparently handles dataset sharding, distributed execution, fault tolerance, checkpointing, metadata updates, and asset registration. This abstraction makes it straightforward to incorporate new data sources, foundation models, and processing stages, including filtering, captioning, embedding generation, scoring, and tagging, without requiring researchers to develop distributed-systems expertise. The result is a platform that lets curation evolve at the pace of research: new signals can be added, recomputed, or replaced incrementally as models, quality criteria, and training recipes change.

### 5.1.1 Large-Scale Data Processing

Multimodal data curation is an iterative enrichment process rather than a single offline preprocessing pass. Raw text, image, and video samples are repeatedly transformed, filtered, annotated, and reprocessed as models, quality criteria, labels, and training recipes evolve. Scaling this workflow is challenging because the pipeline is both low-yield and highly iterative: only a small fraction of raw candidates ultimately survive into training, meaning that inefficient scans, copies, or model inference are disproportionately spent on samples that are later discarded. At the same time, stages such as ingestion, splitting and transcoding, embedding generation, deduplication, filtering, taxonomy tagging, captioning, and sharding repeatedly operate over the same samples. Supporting this workflow therefore requires efficient mechanisms for repeated transformations and incremental recomputation across billions of multimodal samples.

These challenges become even more pronounced under distributed execution. Curation workloads must run continuously on shared clusters with fragmented and dynamically changing GPU availability rather than assuming a single monolithic allocation. The infrastructure must coordinate many distributed workers, avoid duplicate computation, recover from failures, manage heterogeneous CPU- and GPU-bound stages, and continue processing unfinished work as resources become available. To support this execution model, SILA combines a unified data layer with fragment-level coordination and fault recovery, staged distributed execution, node-local model serving, opportunistic cluster utilization, and agent-friendly operational interfaces.

#### Unified data layer.

SILA organizes data curation as a unified columnar Lance dataset (Pace et al., 2025), where each row represents a data sample and each typed column represents a curation signal such as a caption, tag, quality score, or annotation. This replaces the legacy table-per-pipeline architecture used in earlier infrastructure, Cosmos-Predict 1.0 (NVIDIA, 2025a) and 2.5 (NVIDIA, 2025b), where each pipeline wrote to its own Postgres table and outputs were later synchronized into Databricks through Change Data Capture (CDC). As the number of pipelines and metadata fields grew, the table-per-pipeline design required increasingly complex joins across large tables to reconstruct the state of a single sample. These joins became expensive at scale and made even simple operational queries difficult to express without detailed knowledge of join keys, table relationships, and pipeline-specific schemas. In contrast, SILA incrementally enriches the same logical sample by appending new typed columns to a shared Lance table. This unified representation naturally matches multimodal curation workloads, where most stages augment existing samples with additional metadata rather than creating new entities. By co-locating dataset contents, metadata, and processing state, the system can efficiently support large-scale scans, point lookups, incremental recomputation, and discovery of unfinished work directly from Lance fragment metadata without expensive startup joins.

#### Fragment-level coordination and fault recovery.

Curation at this scale runs at high concurrency: many distributed workers within a single job, and many independent jobs in parallel, read from and write to the same continuously evolving Lance dataset. Without explicit coordination, workers must rely on expensive startup queries, randomized sampling, or post-hoc filtering of already processed samples to avoid overlap. These approaches delay job startup, permit duplicate work, and complicate recovery when long-running jobs are preempted or interrupted. SILA instead coordinates distributed curation directly at the Lance-fragment level. Workers discover unfinished fragments from Lance metadata and acquire time-limited leases before processing them, while the Lance dataset itself remains the source of truth for completion state. Lease ownership is maintained through periodic heartbeats; when heartbeats stop, the lease expires and another worker can reclaim the fragment, enabling automatic recovery from failures, preemption, or endpoint crashes without manual cleanup. Because a single fragment may contain many samples and require hours of model inference, SILA further partitions claimed fragments into smaller processing segments, writes completed segments as durable checkpoints, and atomically commits the full fragment back into the Lance through a single metadata update once all segments finish. This decouples the recovery unit from the visibility unit: interrupted jobs resume from completed segments while downstream readers observe only fully committed fragment outputs.

#### Staged Ray execution.

Curation pipelines combine heterogeneous operations with very different resource profiles, including data loading, decoding, model inference, postprocessing, writing, and committing. If these operations are executed through a single undifferentiated control loop, fast upstream stages can accumulate intermediate outputs while slower inference or commit stages become bottlenecks. SILA instead executes each claimed fragment through a staged Ray pipeline engine (Moritz et al., 2018). Framework-managed stages handle loading, writing, and committing, while user-defined preprocess, compute, and postprocess stages execute in separate Ray actor pools with independently configured worker counts and resource requirements. Backpressure limits in-flight work across stage boundaries, preventing fast I/O-heavy stages from overwhelming slower downstream stages and forcing Ray object-store spill to disk.

#### Node-local model endpoints.

Foundation-model curation workloads often require serving large captioning, embedding, tagging, or scoring models while many pipeline workers concurrently process data. Centralized inference services can become bottlenecks at scale, while requiring one large contiguous GPU allocation reduces the ability to exploit fragmented cluster availability. SILA instead launches node-local model-serving endpoints using systems such as vLLM (Kwon et al., 2023) and passes local endpoint information directly to stage workers. Workers then invoke node-local services for inference, allowing model-heavy curation stages to scale across available nodes while decoupling data-parallel pipeline execution from model-serving placement.

#### Opportunistic cluster utilization.

Large-scale curation must run continuously alongside training workloads on shared clusters, where GPU availability is often fragmented and dynamically changing. Instead of requiring one large monolithic allocation, SILA decomposes curation into fine-grained distributed jobs that can execute incrementally as resources become available. The system supports execution backends such as DGX Cloud Lepton (NVIDIA, 2026c) and Slurm (Jette and Wickberg, 2023), allowing pipelines to opportunistically utilize idle or partially available GPU capacity. This improves cluster utilization and enables continuous data processing without requiring large contiguous GPU reservations.

#### Agentic job orchestration.

As AI agents become increasingly capable at tool use and long-horizon execution, SILA exposes large-scale curation workflows through agent-friendly operational interfaces, including reusable skills, command-line interfaces (CLIs), and structured job metadata. Long-running orchestration agents periodically monitor curation jobs, inspect logs and execution metadata, relaunch failed stages, and coordinate operational recovery automatically. Through this continuous monitoring loop, the agents can track pipeline progress, identify stalled or unhealthy workers, verify dataset coverage, trigger incremental recomputation when new models or filtering criteria are introduced, and notify engineers about failures, recoveries, and execution status as distributed jobs evolve over time.

Together, these design choices substantially improved the efficiency of large-scale curation. By eliminating expensive startup table joins and replacing randomized work selection with fragment-level discovery and coordination, SILA reduced job startup latency from 30–60 minutes to roughly 5 minutes, depending on the stage and model configuration. Combined with staged execution, checkpointing, and improved cluster utilization, the new infrastructure achieved a $10\times$ throughput increase over the previous architecture. In peak production windows, individual SILA stages processed billions of row-level annotations per day, reducing large captioning and curation campaigns from month-scale operations to week-scale iteration cycles.

Beyond improving scalability and throughput, SILA also simplifies pipeline development by hiding much of the operational complexity behind a dataset-centric interface. Pipeline authors specify only the input columns they consume and the output fields they produce, while the framework handles schema registration, column creation, fragment discovery, work coordination, checkpointing, and committing results back to the shared dataset. As a result, adding new captioning, scoring, tagging, or filtering stages no longer requires creating new storage tables, writing synchronization logic, or manually coordinating distributed workers. Researchers can instead iterate by incrementally adding new typed columns, reusing previously computed outputs, and recomputing only samples whose required fields are missing.

### 5.1.2 Embedding Storage and Semantic Retrieval

Semantic retrieval workloads require both vector similarity search and metadata-aware filtering over billions of multimodal data. In the previous architecture, storing high-dimensional embeddings directly in SQL tables significantly inflated table size, increasing I/O overhead for joins, scans, and operational queries. As a result, embeddings were exported into a separate vector database, while metadata used for pre-filtering, post-filtering, and result interpretation remained in relational storage. However, embeddings, metadata, and filtering criteria evolve continuously during curation, requiring frequent synchronization and migration between two systems whenever new embedding models, metadata fields, or search filters are introduced.

SILA instead stores embeddings directly alongside sample metadata in Lance, allowing LanceDB to build vector indexes over the primary dataset rather than requiring a separate vector database (LanceDB, 2026). Because embeddings are stored in Lance data files rather than inline relational rows, large embedding payloads do not inflate metadata tables or slow operational queries. By co-locating embeddings, metadata, and vector indexes within the same storage layer, SILA supports semantic retrieval, clustering, and deduplication directly over the curated dataset while keeping search results consistent with the latest curation state.

In production, SILA performs semantic retrieval, clustering, and deduplication over a 4096-dimensional embedding column covering tens of billions of rows using LanceDB IVF_PQ indexes with cosine similarity. The deployed Approximate Nearest Neighbor (ANN) configuration uses 64K IVF partitions together with PQ-compressed embeddings to support billion-scale retrieval workloads efficiently. Because the vector indexes are built directly over the primary Lance datasets, semantic retrieval operates over the same storage layer that maintains the latest curation metadata and filtering state. This allows metadata-aware filtering, nearest-neighbor retrieval, and downstream dataset analysis to remain synchronized with continuously evolving embeddings, annotations, and curation outputs without requiring synchronization between separate vector and metadata systems.

### 5.1.3 Dataset Visualization, Inspection, and Debugging

At production scale, data curation must be observable as well as scalable: researchers need to understand pipeline coverage, track how curation outputs evolve over time, and diagnose why individual samples pass or fail quality criteria. SILA therefore treats visualization, inspection, and debugging as first-class components of the data infrastructure. Its tools operate directly over Lance tables, connecting aggregate pipeline progress, representative development subsets, sample-level inspection, and downstream analytical views within the same shared curation substrate.

- *Development and pipeline validation.* SILA provides utilities for constructing small development Lance tables from production datasets while preserving the schema and representative operational characteristics of the full corpus. Because these development tables closely mirror production data, the same pipelines can run unchanged in both environments, allowing researchers to validate correctness and execution behavior before launching large-scale production jobs.

- *Dataset inspection and progress analysis.* To support large-scale curation monitoring, SILA exposes both aggregate progress analyzers and interactive inspection tools directly over Lance tables. Fragment-level metadata is used to estimate per-column coverage and pipeline completion without requiring full table scans, while interactive viewers allow researchers to sample rows, render media, and inspect the associated captions, scores, annotations, and schema metadata. Because Lance supports efficient random row-level access, these inspection workflows can operate directly over the primary curation tables, avoiding the expensive scans and limited row-level retrieval patterns common in traditional Parquet-based data lakes. This allows researchers to move quickly from pipeline-level progress monitoring to sample-level debugging within the same dataset.

- *Analytical querying integration.* For large analytical workloads, SILA supports Online Analytical Processing (OLAP) queries used for large-scale aggregation, reporting, and dashboarding over the curated corpus. These queries are simpler to express because SILA stores each sample and its curation signals in a wide Lance table: captions, tags, scores, embeddings, filtering decisions, and processing state can be selected and filtered from one logical dataset rather than reconstructed through joins across pipeline-specific tables. After selecting the relevant columns and cohorts, analytical backends can compute the required aggregations for coverage reports, quality dashboards, dataset audits, and training-set analysis. SILA keeps the Lance table as the source of truth for curation state, media, metadata, embeddings, vector indexes, and row-level inspection, while treating downstream analytical execution as a deployment choice. In practice, SILA can scan the authoritative Lance tables to materialize query-ready snapshots or projections, including Parquet files (Le Dem, 2013), and execute OLAP workloads using the available compute backend, such as Databricks, Spark clusters (Zaharia et al., 2016), or Slurm-backed batch jobs.

Across processing, retrieval, and inspection, SILA closes the loop on the three objectives that define the Cosmos 3 data infrastructure: transforming raw multimodal corpora into training-ready samples, organizing them for semantic retrieval and deduplication, and keeping them inspectable throughout the curation lifecycle. By unifying assets, curation signals, embeddings, vector indexes, and execution state within a single Lance-backed substrate, SILA turns data curation from a sequence of one-off preprocessing jobs into a continuously evolving production workflow. New models and quality criteria can be applied incrementally, distributed enrichment stages can recover and scale across shared heterogeneous clusters, and researchers can move seamlessly from corpus-level progress monitoring to sample-level debugging. This integrated workflow enables the Cosmos 3 training corpus to scale to tens of billions of multimodal candidates while remaining searchable, auditable, and continuously improvable.

## 5.2 Training Infrastructure

Cosmos 3 leverages a custom infrastructure platform engineered for scaling multimodal foundation-model training. This unified stack coordinates the end-to-end lifecycle for the Reasoner and Generator training. This lifecycle spans raw multimodal sample ingestion, training computation, and persistent checkpointing, and is structured around the stages described below.

- *Data loader.* The data loader ingests multimodal samples—images, videos, action, audio, text—at arbitrary native resolutions and aspect ratios. It applies on-the-fly augmentation (\eg, resizing, spatial cropping, color jitter, and temporal video sub-sampling), tokenizes text conditions, and packs variable-length samples into batches. To hide I/O and pre-processing latency, the loader runs asynchronously in parallel worker processes and prefetches batches onto the device via a pinned-memory staging buffer.

- *Distributed training.* Training is parallelized using a combination of Hybrid Sharded Data Parallelism (HSDP) and Context Parallelism (CP). This approach enables scaling to large model sizes and extended input sequence lengths. HSDP shards optimizer states, gradients, and model parameters within each replica group while replicating across groups. CP shards the sequence dimension across devices to handle massive context windows that would otherwise overflow a single GPU’s memory capacity. These two strategies compose orthogonally and are dynamically configured per experiment to optimize for the target model size, sequence length, and cluster topology.

- *Training loop.* Orchestrated in the style of TorchTitan (Liang et al., 2024b), the training loop executes standard forward, backward, optimization, and learning-rate-scheduling cycles. It natively supports various optimizers (\eg, AdamW and fused variants), schedulers (\eg, cosine with warmup, constant with warmup), and loss functions (cross-entropy loss for Reasoner text and EDM loss for Generator). Also incorporating on-the-fly variational encoders (\eg, the Wan2.2 VAE), the pipeline operates end-to-end on raw multimodal inputs. This design eliminates offline latent-extraction phases and ensures that augmentation, encoding, and training remain in lockstep across runs.

- *Checkpoint saving.* Checkpoints are recorded at a configurable cadence and use an asynchronous, off-critical-path persistence mechanism to prevent disk and network I/O from stalling the training loop. Model parameters, optimizer states, and RNG/data-loader state are snapshotted on-device, handed off to a background writer, and serialized to remote storage while training continues uninterrupted.

Both Reasoner and Generator are trained with this unified framework, sharing a common trainer, parallelization architecture, optimizers, learning rate schedulers, tokenizers, data loaders, and monitoring utilities.

### 5.2.1 Data Loader

The data loader bridges persistent storage and the training loop: it ingests raw multimodal training data, applies on-the-fly augmentation, and forms the batches consumed by each training step. In Cosmos 3, the data loader is required to satisfy three concurrent requirements:

- *Pipeline saturation.* It must stream batches asynchronously to prevent the training loop from stalling or blocking on data I/O.

- *Distributed load balancing.* It must emit balanced batches across distributed ranks to minimize cross-rank synchronization stalls and maximize aggregate GPU utilization.

- *Distribution fidelity.* It must guarantee that the long-run modality and resolution mixtures strictly adhere to the configured target distribution.

In conventional LLM training, all three requirements have well-established remedies.

- *Pipeline saturation.* This is achieved by tuning the worker count, prefetch depth, and using pinned-memory staging buffers to overlap host-to-device transfers with compute.

- *Load balancing.* This becomes trivial because every sample contributes a fixed number of tokens. Maintaining identical per-rank sample counts guarantees uniform per-rank compute and activation-memory profiles across ranks.

However, Cosmos 3 invalidates this recipe along all three axes. Since its joint training corpus spans highly heterogeneous modalities, the per-sample token counts vary by over two orders of magnitude, making token volume the primary driver of compute and memory costs. For example, a single 720p two-second video clip produces more tokens than dozens of short text captions combined. Under this asymmetric workload, allocating equal per-rank sample counts introduces critical systemic inefficiencies: it incurs (a) substantial padding waste due to fixed batch shapes; (b) severe workload imbalance across ranks when modality assignments differ; and (c) at scale NCCL collective timeouts caused by extreme step-time variance.

To address these challenges, the Cosmos 3 data loader is built around four coordinated mechanisms: (i) *token-budgeted packed sequences* , which bound each rank’s per-step workload by a token budget rather than a fixed sample count; (ii) a *joint data loader* , which multiplexes per-stream loaders into a single unified training batch; (iii) *rank-synchronous stream selection* , which uses a globally seeded selector to keep all ranks aligned on the same data stream at every step; and (iv) *look-ahead packing* , which raises the average utilization of the token budget $T_{\max}$.

#### Token-budgeted packed sequences.

Rather than fixing the per-step sample count, each rank’s workload is bounded by a strict token budget $T_{\max}$. The loader greedily concatenates samples into a single packed sequence—each contributing exactly as many tokens as its serialized form requires, with no padding inserted between samples—until appending the next candidate would exceed $T_{\max}$. By eliminating cross-sample padding, this design bounds the per-step compute cost as a direct and predictable function of $T_{\max}$, isolating the hardware from execution variance induced by a fluctuating modality mix. As a defensive secondary constraint, the per-step sample count is also capped at $N_{\max}$.

#### Joint data loader.

Each modality, dataset, or finer-grained data stream is encapsulated in its own loader with a private prefetch buffer that hides storage latency. A *joint data loader* (illustrated in Fig. 12) multiplexes across these per-stream loaders to assemble a single unified training batch per step, while fully preserving per-stream buffering, prefetching, and observability.

![Figure 12](figures/joint_dataloader.svg)

> Figure 12: **Overview of the Joint Data-Loader. Stream-specific data-loaders feed local per-stream buffers on each rank. At each global iteration, a rank-synchronous selector chooses the same stream $k_{i}$ across distributed ranks. Each rank then greedily packs samples from its selected local buffer into $B_{i}^{(\rho)}$ under token and sample-count budgets, using bounded look-ahead to reduce unused token capacity.**

#### Rank-synchronous stream selection.

Foundation-model training typically draws from datasets containing both images and videos at multiple spatial resolutions. Per-sample token counts differ by orders of magnitude across these streams. For example, video samples often carry over $100\times$ more tokens than images, and 720p videos over $10\times$ more than 256p videos. Allowing each rank to choose its stream independently would induce severe workload imbalance under FSDP, with widely divergent attention FLOPs (due to its quadratic complexity) across ranks within a single step. We mitigate this by selecting the active stream via a globally seeded selector keyed on the iteration index, ensuring that all ranks process samples drawn from the same modality and resolution bucket at every step. This eliminates cross-rank variance in compute time and activation memory, while the deterministic, seed-derived selection sequence is bit-exactly reproducible across checkpoints and restarts. Rank-synchronous stream selection improves end-to-end training throughput by $54\%$ over the unsynchronized baseline.

#### Look-ahead packing.

Given the stream $k_{i}$ selected for iteration $i$, the Joint Data-Loader constructs the local batch greedily, appending samples from the head of the stream’s buffer until the next candidate would exceed the token budget $\mathbb{T}_{\max}$. Pure greedy packing, however, can leave a non-trivial fraction of the budget unused whenever the next candidate is large enough to overflow but smaller candidates remain available deeper in the buffer—residual capacity that is functionally equivalent to padding and directly proportional to lost throughput. We address this with a bounded look-ahead policy. When a candidate sample exceeds the *total* token budget $\mathbb{T}_{\max}$, the sample is unpackable under the current configuration and is dropped (with a logged warning). When a candidate merely exceeds the *remaining* budget but the batch is already non-empty, the candidate is moved temporarily into a *look-aside buffer* , and the loader continues scanning further into the stream buffer for a smaller sample that fits the residual capacity.

The mechanism is illustrated in Fig. 13. In the example, samples $a_{1}$ and $a_{2}$ fit into the current batch; $a_{3}$ exceeds the remaining budget and is diverted to the look-aside buffer; the loader then continues scanning and packs subsequent smaller samples such as $a_{4}$ and $a_{6}$. At the end of the iteration, all samples remaining in the look-aside buffer are restored to the head of the stream buffer in their original arrival order, so that look-ahead reduces padding without permanently reordering the stream. To bound the cost of pathological cases—e.g., a stream temporarily dominated by oversized samples—the number of consecutive look-ahead attempts per iteration is capped by a configurable per-stream limit. In production, we use a cap of ten; beyond this value, we observe negligible additional reduction in unused capacity, while the size of the look-aside buffer (and its memory footprint) continues to grow. Overall, look-ahead packing increases the effective sequence length by $8\%$ over the baseline, yielding a corresponding improvement in training throughput.

> Figure 13: **Look-ahead packing in the JointDataLoader. The loader greedily scans samples from the selected stream and packs those that fit within the remaining token budget into the current mini-batch (Mint). Samples that exceed the budget are temporarily set aside in a lookaside buffer (Rose), allowing later smaller samples to fill the remaining capacity. At the end of the iteration, skipped samples are returned to the head of the stream buffer in their original arrival order, reducing padding while preserving stream order across iterations.**

> （Figure 13 在 HTML 中为内联 TikZ，无图片文件；下表为其内容还原，原图见 PDF）

| **step** | **packed (in output_batch)** | **skipped (set aside)** | **state** |
|---|---|---|---|
| fetch x1 (fits) |   |   | $\mathrm{cur}=\tau(x_{1})$ |
| fetch x2 (fits) |   |   | $\mathrm{cur}=\tau(x_{1})+\tau(x_{2})$ |
| fetch x3 (overflow) |   |   | $\mathrm{skipped}\leftarrow\{x_{3}\},\quad\mathrm{lookahead}=1$ |
| fetch x4 (fits) |   |   | $\mathrm{cur}\mathrel{+}=\tau(x_{4})$ |
| fetch x5 (overflow) |   |   | $\mathrm{lookahead}=2$ |
| fetch x6 (fits, last) |   |   | batch done |
| end of iter t |   |   | push reversed(skipped) $\rightarrow$ head: [x3, x5, x7, x8, ...] |
|   |   |   | *∗* fits in $\mathbb{T}_{\max}$ budget |

※ 本表含跨行合并单元格，短行已按「首列被合并」在前补空。

#### Cold-start handling.

Several of our data streams incur substantial first-batch latency, dominated by worker-process spawning, filesystem metadata caching for newly opened shards, and stream-specific deserialization warm-up. If this latency were paid at the first training step, it would race against the NCCL collective on that step, with a high probability of triggering a watchdog timeout on the slowest rank—particularly at scale, where the maximum over ranks is the relevant statistic. To eliminate this failure mode, the Joint Data-Loader performs an explicit pre-warm stage during construction: it fetches one batch from every stream so that worker pools, file handles, and deserialization caches are fully primed, and then issues a distributed barrier before returning control to the training loop. This guarantees that every rank has paid the cold-start cost before the first forward pass and that the first iteration runs against fully warmed streams.

#### Observability and integration.

At every iteration, the Joint Data-Loader emits a structured record of packing statistics to a training-side monitoring callback, which aggregates the per-rank records across the distributed group and logs the result to Weights & Biases. The reported metrics include the empirical per-stream sampling ratio (compared against the configured target mixture), the number of samples packed per iteration, per-stream buffer occupancy and wait time, the look-ahead saturation rate, and per-iteration token-budget utilization. These metrics expose the failure modes most likely to degrade large-scale training without crashing it so that such issues are surfaced in the training dashboard within minutes of onset rather than discovered later from model behavior.

### 5.2.2 Attention Implementation

As discussed in Sec. 2.3.1, the Mixture-of-Transformers architecture in Cosmos 3 imposes two distinct attention requirements that must coexist within a single forward pass: the Reasoner pathway employs causal attention over the Reasoner tokens only, while the Generator pathway employs bidirectional attention over the concatenation of the Reasoner and the Generator tokens, so that each Generator token can condition on the full context. Naively expressing these heterogeneous masking patterns with general-purpose operators such as FlexAttention produces correct results but underutilizes the hardware: the masking structure is opaque to the kernel, and padding-equivalent work is performed inside otherwise-skipped attention blocks. This degrades tensor-core utilization and inflates memory-bandwidth pressure.

To address this, we co-designed a custom two-way flat attention mechanism that exposes the cross-pathway masking structure directly to a high-performance variable-length attention kernel. Fig. 14 illustrates the design. The computation is decomposed into two separate kernel invocations. The first handles the Reasoner pathway and is a standard variable-length scaled dot-product attention (SDPA) (PyTorch Contributors, 2026b) call with a causal mask, operating only on the Reasoner queries, keys, and values. The second handles the Generator pathway and requires the Reasoner and Generator key/value streams to be visible to each Generator query within the same sample, but strictly separated across samples in a packed batch. We achieve this by flattening and interleaving the two token streams at the sample granularity in the order

$$[R_{0},G_{0},R_{1},G_{1},\ldots,R_{n},G_{n}]$$

where $R_{i}$ and $G_{i}$ denote the Reasoner and Generator key/value tokens of sample $i$, respectively. Each Generator query attends bidirectionally over its own sample’s $[R_{i},G_{i}]$ block. This formulation expresses the full cross-pathway attention with two variable-length kernel launches per layer, supports both causal and bidirectional masking within one packed representation, eliminates the padding overhead inherent to fixed-length implementations, and yields $22\%$ improvement in end-to-end training throughput compared to a FlexAttention-based baseline for the Cosmos3-Nano model.

![Figure 14](figures/tikz_two_way_attention.svg)

> Figure 14: **Two-way flat attention. Each pathway is implemented as a single variable-length SDPA call. (a) The Reasoner pathway uses a standard causal varlen call on the packed Reasoner tokens, producing a block-diagonal causal mask. (b) The Generator pathway packs Generator queries separately from the interleaved key/value stream $[R_{0},G_{0},R_{1},G_{1},\ldots,R_{n},G_{n}]$. The resulting mask is block-diagonal but rectangular within each block, so that each Generator query attends bidirectionally over its own sample’s $[R_{i},G_{i}]$ context without crossing sample boundaries. The example uses three packed samples with $(|R_{i}|,|G_{i}|)=(3,2),\,(2,3),\,(4,1)$.**

The variable-length attention backend is selected per platform to match the most performant and numerically validated implementation available on the target hardware. On Hopper-class GPUs (H100, H200), we use FlashAttention-3 (Shah et al., 2024), which exploits the WGMMA instructions and TMA-based asynchronous data movement of the Hopper architecture to deliver near-peak attention throughput. On Blackwell-class GPUs (GB200), we use NATTEN (Hassani et al., 2023), whose variable-length kernels are built on the CUTLASS template library and are specifically tuned for the fifth-generation tensor cores and updated memory hierarchy of Blackwell (SM100/SM103). Both backends are accessed through a common dispatch interface, so the choice of kernel is transparent to the rest of the training stack and can be revisited as new backends mature.

### 5.2.3 Distributed Training

Cosmos 3 Reasoner and Generator are trained separately with a distributed-training stack that combines Hybrid Sharded Data Parallelism (HSDP) with Context Parallelism (CP). HSDP shards model parameters, gradients, and optimizer states within each replica group while replicating across groups, which trades a modest amount of intra-group communication for the memory headroom required to train multi-billion-parameter models on commodity per-GPU memory budgets. CP, in contrast, addresses a different bottleneck: per-sequence activation memory, which scales linearly with context length and would otherwise force a hard upper bound on the trainable sequence size. The two strategies compose orthogonally, and the (HSDP-degree, CP-degree) configuration is chosen per experiment to fit the target model size, sequence length, and cluster topology.

#### Context parallelism via the Ulysses scheme.

For CP, we adopt the Ulysses scheme (Jacobs et al., 2023), which partitions the input sequence along the token dimension across CP-rank devices outside of attention and employs two all-to-all collectives per attention layer to transition between sharding axes. The first collective redistributes the Q/K/V activations from the sequence dimension to the attention-head dimension, so that each rank holds the complete sequence for a disjoint subset of heads and can execute attention locally without further cross-rank communication; the second collective restores the original sequence-sharded layout on the attention output.

The scheme integrates cleanly with sequence packing (described in Sec. 5.2.1) and the two-way attention mechanism. The flattening and interleaving of the Reasoner and Generator key/value streams for the bidirectional attention operation is deferred until after the head-axis redistribution, at which point each rank already holds the full sequence for its assigned heads and can perform the concatenation locally. The same variable-length attention kernels are therefore reused unchanged inside CP, with no need for CP-specific kernel variants. The maximum CP degree supported by this implementation is bounded by the number of query heads in the model—32 for Cosmos3-Nano and 64 for Cosmos3-Super—which we find to be a non-restrictive limit in practice given the context lengths and per-GPU memory budgets targeted by Cosmos 3.

#### Why not ring attention?

We considered implementing CP via ring attention as an alternative, but found it substantially less attractive in our setting. Ring attention would require materializing a single packed sequence containing the interleaved Reasoner and Generator tokens before sharding it across CP ranks, in order to expose a contiguous K/V stream to the ring schedule. This precludes the independent sharding of the two pathways that Ulysses naturally permits, and complicates the construction of the per-sample bidirectional/causal masks under the rotating ring schedule. Combined with the favorable bandwidth profile of all-to-all on NVLink-connected nodes, these factors led us to adopt Ulysses as the CP strategy for Cosmos 3.

### 5.2.4 Selective Activation Checkpointing

Computing the backward pass of a transformer requires the intermediate activations produced during the forward pass to be available, but materializing all of them simultaneously in GPU memory is prohibitive at the model sizes and context lengths targeted by Cosmos 3. The standard mitigation is activation checkpointing (Chen et al., 2016): the forward pass stores only a sparse set of “anchor” activations and discards the rest, and the discarded tensors are recomputed during the backward pass by re-running the corresponding forward subgraph from the nearest saved anchor. The default policy stores only the inputs of each transformer block and recomputes everything inside the block on demand; this minimizes activation memory but introduces an additional forward pass during backward, inflating per-step FLOPs by roughly $33\%$ and reducing end-to-end training throughput accordingly.

To reduce this recomputation overhead while staying within the activation-memory budget, we apply Selective Activation Checkpointing (SAC), in which a curated subset of intermediate tensors is additionally retained in memory rather than recomputed. The selection is guided by a simple cost-benefit heuristic: rank candidate operations by their FLOPs-to-memory ratio—i.e., the recomputation cost saved per byte of activation memory committed—and materialize those with the highest ratio first, until the activation-memory budget is exhausted. For Cosmos 3, attention outputs are by far the dominant beneficiary of this policy. Attention recomputation is expensive because its cost scales quadratically with sequence length, yet the attention output tensor itself is comparatively small (linear in sequence length and hidden size), making it the operation with the highest FLOPs-to-memory ratio. Users can additionally configure custom save sets through regular-expression patterns over operation names, which we use to retain a small number of secondary tensors when the residual activation-memory headroom permits.

In our measurements, applying SAC with attention outputs materialized yields a $13\%$ improvement in end-to-end training throughput for Cosmos3-Nano at a per-batch token budget of $74{,}000$ tokens, with no change in numerical results.

### 5.2.5 Torch Compile for Transformer Blocks

We apply torch.compile with fullgraph=True and dynamic=True across the training graph. The fullgraph mode eliminates CPU overheads and enables operator fusion, while dynamic=True handles the variable sequence lengths arising from mixed-modality batches—where, for example, Generator pathway tokens are substantially longer than those of image batches across iterations. Torch compile improves training throughput by $41\%$ for Cosmos3-Nano Generator training.

### 5.2.6 Video Tokenizer

Cosmos 3 training requires decoded video frames to be tokenized on-the-fly into latent representations by a video VAE: Wan2.2 (Wan et al., 2025b) in our configurations. In the initial implementation, we observed that the tokenizer occupied a disproportionate fraction of each training step—dominating the forward pass for the smaller Cosmos3-Edge and Cosmos3-Nano models. In such models, the transformer compute is small enough that the VAE is not amortized by the rest of the step. Because the tokenizer sits on the critical path between the data loader and the training loop, any latency it introduces directly degrades training throughput. We therefore implemented a series of targeted optimizations that, together, reduce the tokenizer’s wall-clock contribution significantly.

#### Chunked encoding.

The Wan2.2 causal tokenizer encodes a 1-frame “prime” chunk followed by groups of 4 pixel frames per latent chunk; the default per-call granularity is one latent chunk (\ie, 4 frames after the prime). This default leaves the GPU substantially under-utilized for the spatial resolutions used in training, because each kernel launch operates on too little work to saturate the tensor cores. We instead invoke the encoder on a configurable number of pixel frames per call, trading additional activation memory for higher arithmetic intensity per launch. The optimal chunk size is resolution-dependent. At higher spatial resolutions, each frame already consumes substantial memory, so fewer frames per call are admissible before triggering OOMs, whereas at lower resolutions, much larger chunks are feasible and beneficial. We empirically determined the following operating points on our training hardware: 68 frames for 256p, 24 frames for 480p, and 12 frames for 720p. These configurations push the encoder onto the compute-bound side of the roofline curve while staying well under per-GPU memory budgets, yielding the bulk of the per-step speedup.

#### Ahead-of-time compilation.

![Figure 15](figures/aoti_compile_figure.svg)

> Figure 15: **Sharded AOT compilation of the Wan2.2 tokenizer. The $45$ static-shape graphs arising from $\{3\text{ resolutions}\}\times\{5\text{ aspect ratios}\}\times\{3\text{ tokenizer call modes}\}$ are partitioned across ranks; each rank performs compilation on its assigned graph(s), writes the compiled artifact to a shared filesystem, and loads the full set of artifacts before training begins. Warm-up time drops from $\sim\!15$ min (serial) to $<\!1$ min (sharded).**

On top of chunked encoding, we use torch.compile on the tokenizer, which delivers an additional $52\%$ reduction in encode latency by fusing pointwise operations and selecting optimized kernel schedules for the encoder’s convolution and attention blocks. Maximizing throughput requires static input shapes, so the encoder is compiled separately for each shape it may be invoked with. Cosmos 3 training spans three spatial resolutions ($256\text{p}$, $480\text{p}$, $720\text{p}$) and five aspect ratios per resolution. Within each (resolution, aspect-ratio) combination, the causal tokenizer is called in two modes: prime-chunk encoding and chunked encoding with cache sizes of $1$ and $2$. This yields $3\times 5\times 3=45$ distinct graphs that must be compiled before training can begin. Compiling all $45$ graphs serially on every rank inflated trainer startup by roughly $15$ minutes.

To eliminate this overhead, we shard the compilation across data-parallel ranks using AOTInductor (PyTorch Contributors, 2026a) as shown in Fig. 15, which performs ahead-of-time compilation and serializes the resulting kernels and host code to disk. With at least $45$ ranks (which is satisfied by all of our training configurations), each rank compiles exactly one graph; the compiled artifacts are written to a shared filesystem, after which every rank loads the full set of $45$ graphs from disk. This reduces the warm-up overhead to under one minute. To accommodate videos with arbitrary frame counts under static-shape compilation, each input clip is right-padded to the next multiple of the configured encode-chunk size prior to encoding, and the resulting latent tensor is cropped along the temporal axis to the exact expected sequence length before being consumed by the model.

#### Specialization to known frame counts.

For datasets in which the per-clip frame count is fixed and known a priori—for example, robot action datasets, where every episode contributes a clip of identical length—we specialize the compilation to the exact tensor shapes that arise at runtime, bypassing the padding-and-crop fallback used in the general case. This eliminates the padded-tail compute, removes the corresponding latent-cropping step, and yields a small but consistent additional throughput improvement on such datasets.

### 5.2.7 Checkpointing

To eliminate save-induced stalls, checkpointing is fully overlapped with training. Following Torchtitan (Liang et al., 2024b), checkpoint writes are routed through a dedicated Gloo process group rather than the NCCL communicator carrying training collectives, isolating I/O traffic from GPU-side communication. This asynchronous design hides the highly variable object-store write latencies and removes nearly all save-time overhead, at the cost of a modest increase in host memory. Tab. 7 quantifies the resulting benefit: relative to synchronous checkpointing at a 30-minute interval, asynchronous checkpointing reduces end-to-end training time by $4\%$ for Cosmos3-Nano and $9\%$ for Cosmos3-Super.

> Table 7: **Benefits of asynchronous checkpointing. Compared with synchronous checkpointing at a 30-minute interval, asynchronous checkpointing reduces end-to-end training time by $4\%$ and $9\%$ for Cosmos3-Nano and Cosmos3-Super, respectively. The larger savings on Cosmos3-Super reflect its longer checkpoint save times.**

| **Model** | **Checkpoint Save Time (s)** |   |   | **Speedup over Synchronous** |
|---|---|---|---|---|
|   | **Mean** | **Min** | **Max** |   |
| **Cosmos3-Nano** | 72 | 43 | 250 | $4\%$ |
| **Cosmos3-Super** | 167 | 40 | 736 | $9\%$ |

#### Asynchronous save mechanism.

At construction time, the checkpointer launches a long-lived child process using the spawn start method and communicates with it through multiprocessing queues. The child process joins a Gloo process group and performs CPU-side reductions needed to construct the save plan, leaving GPUs available for training. It then blocks on an inbound queue until it receives either a checkpoint save request or a termination sentinel.

#### Save plan memorization.

To further reduce overheads, checkpoint save plans are computed during the first checkpoint saving operation, and reused for subsequent saves. This is possible because the save plan is a deterministic function of the state-dict topology. Reusing the plan avoids repeated metadata communication across ranks and reduces checkpointing overhead by approximately **60%** , further decreasing the likelihood that asynchronous checkpointing becomes a training bottleneck.

#### Optimizing for object storage.

During checkpoint saving, each rank writes its local shard of the state dictionary to object storage. Replicated tensors, which may be present on multiple ranks, are deduplicated before writing. In the default round-robin assignment, replicated tensors may be written by different ranks, requiring each rank to read all checkpoint files during loading in order to recover the replicated state. This introduces significant overhead because full files must be loaded even when only a subset of their contents is required. To reduce this overhead, we set dedup_to_lowest_rank = True, which stores replicated tensors only on the lowest-numbered rank in the corresponding submesh, typically rank 0. During loading, each rank then reads only its own shard and the rank-0 shard. This substantially reduces checkpoint load time, particularly for optimizer state dictionaries, which contain many small replicated tensors.

#### Random state restoration.

The trainer restores random number generator (RNG) state in a rank-aware manner. Since RNG state is keyed by rank, a resumed job first checks the checkpoint metadata for the key corresponding to its own rank and requests that state only if it is present. This preserves compatibility with older checkpoints that predate the rank-keyed RNG format. If the rank-specific key is absent, the rank retains its current RNG state.

### 5.2.8 Throughput Summary

Tab. 8 reports steady-state, per-GPU training throughput for the Cosmos 3 dense configurations measured on NVIDIA GB200 systems. Although Cosmos 3 supports multiple training modes across heterogeneous modalities and tasks, these measurements were obtained using a joint text-to-image and text-to-video training configuration to enable a standardized throughput comparison. Fig. 10 illustrates the pre-training data mixture used. Cosmos3-Nano was benchmarked using 1024 NVIDIA GB200 GPUs, while Cosmos3-Super was benchmarked using 2048 NVIDIA GB200 GPUs.

The Nano model achieves the highest raw token throughput, processing 507 iterations per hour and reaching 4.56M image tokens and 16.23M video tokens per GPU-hour. In contrast, the larger Super model performs substantially more computation per iteration, reducing its iteration rate to 185 iterations per hour and its throughput to 1.66M image tokens and 5.91M video tokens per GPU-hour.

Despite its lower token throughput, Cosmos3-Super achieves higher arithmetic utilization, increasing per-GPU throughput from 520 to 673 TFLOPS and improving MFU from 0.23 to 0.30. This reflects the expected trade-off between model scale and training throughput: Cosmos3-Nano is optimized for maximizing token processing throughput, whereas Cosmos3-Super more effectively saturates GPU compute resources through increased model capacity and computation per token.

> Table 8: **Steady-state training throughput for Cosmos 3 dense model configurations. TFLOPS and MFU are reported per GPU. Image and video token throughput are reported separately in millions of tokens per GPU-hour. The experiments were conducted with NVIDIA GB200 GPUs, where the Nano and Super runs took 2048 and 4096 GPUs, respectively.**

| **Model** | **Iter (s)** | **TFLOPS** | **MFU** | **Iter/hr** | **Img Tok/hr/GPU (M)** | **Vid Tok/hr/GPU (M)** |
|---|---|---|---|---|---|---|
| **Cosmos3-Nano** | 7.1 | 520 | 0.23 | 507 | 4.56 | 16.23 |
| **Cosmos3-Super** | 19.5 | 673 | 0.30 | 185 | 1.66 | 5.91 |

## 5.3 Serving Infrastructure

Cosmos 3 is integrated with multiple production-grade serving frameworks to support a broad range of deployment scenarios. Reasoner is supported by TensorRT-LLM (NVIDIA Corporation, 2026) and vLLM (Kwon et al., 2023), both of which provide highly optimized autoregressive decoding through paged KV-cache management, continuous batching, and fused attention kernels. Generator inference is supported by vLLM-Omni (multimodal extension of vLLM for diffusion-based generation) (Yin et al., 2026), which provides complementary trade-offs between peak throughput and multi-tenant scheduling efficiency. In addition to these production backends, we provide a reference implementation in native PyTorch that prioritizes readability and modifiability, serving as both a faithful specification of the inference algorithm and a starting point for downstream adaptation, research extensions, and integration into custom application pipelines.

### 5.3.1 Plain PyTorch

The plain PyTorch serving path executes the model and the surrounding inference procedure directly in eager-mode PyTorch—without dependence on specialized serving runtimes—and is designed to mirror the training-time computation as faithfully as possible. This path is responsible for the complete end-to-end inference workflow, comprising the stages described below:

- *Input preparation.* Parses the text prompt, loads any image, video, or action conditioning, constructs the modality-specific conditioning dictionaries consumed by the model, and assembles the corresponding input tensors and metadata.

- *Autoregressive loop.* In the Cosmos 3 Reasoner, output tokens are produced autoregressively, with each step conditioned on the previously generated tokens and on the cached key/value states of the conditioning context.

- *Diffusion loop.* In the Cosmos 3 Generator, the PyTorch path constructs the timestep schedule, invokes the denoiser at each step, applies classifier-free guidance (CFG), updates the latent state according to the sampler, and manages the request-level control flow around the denoising process.

- *Decoding and post-processing.* Once denoising completes, the resulting latent representation is decoded into the target modality—text, image, video, audio, or action—post-processed as required, and returned to the caller through the serving interface.

Because the native PyTorch backend preserves the model’s original PyTorch structure, it serves as the primary target for landing new model features, sampler modifications, KV-cache and activation-cache policies, and debugging instrumentation. New capabilities are validated in this backend first and only subsequently ported to the production runtimes (TensorRT-LLM and vLLM), ensuring that the reference implementation remains the authoritative specification of the inference algorithm. The PyTorch backend exposes the following features and optimizations.

#### Torch compile with CUDA graphs.

Since the PyTorch native inference path keeps request orchestration and sampling logic in Python, a major serving bottleneck is host-side kernel launch overhead during repeated denoising steps. We therefore optimize the PyTorch path using torch.compile and CUDA graph replay. CUDA graph optimization is implemented at transformer-layer granularity, capturing repeated transformer block executions. Each block is compiled with torch.compile in reduce-overhead mode, which allows PyTorch Inductor to lower the block and use CUDA graph replay when the block is invoked with compatible tensor shapes and memory layouts. The outer inference loop remains in ordinary PyTorch, \ie, prompt handling, timestep scheduling, sampler updates, CFG orchestration, decoding are not part of the captured graph. The graph contains the numerically heavy and frequently repeated per-layer computation, while dynamic serving logic remains outside the graph. The benefit of CUDA graphs is most visible for T2I-style generation, where shorter generation workloads and smaller kernels make CPU launch overhead a larger fraction of end-to-end latency. CUDA Graphs on T2I generation yielded 30% to 60% speedups on different hardware backends.

#### Distributed inference.

We employ context parallelism (CP) at inference time to support generations exceeding per-GPU memory capacity constraints. We retain the Ulysses scheme (Jacobs et al., 2023) used during training, ensuring consistency between the two regimes. Beyond enabling long-context inference, CP also serves as a latency-reduction mechanism by distributing the forward pass across multiple GPUs; this benefit is realized even in regimes where a single device’s memory is sufficient to hold the full context, making CP a general-purpose tool for accelerating inference.

In addition to context parallelism, we exploit classifier-free guidance (CFG) parallelism to further reduce end-to-end inference latency. Diffusion sampling with CFG requires, at every denoising step, two forward passes through the model—one conditioned on the input prompt and one unconditional—whose noise predictions are linearly combined to produce the guided update. Because the conditional and unconditional passes operate on independent inputs and only need to synchronize once per step to form the guided prediction, they are an ideal target for parallelization across two GPUs. In practice, we dispatch the conditional and unconditional batches concurrently, and perform a single lightweight point-to-point exchange to combine the two predictions before advancing the sampler. This nearly halves the per-step latency, and composes cleanly with context parallelism to deliver multiplicative latency reductions on multi-GPU nodes.

#### Reasoner tower caching.

For tasks such as text-to-image (T2I), text-to-video (T2V), image-to-video (I2V), and video-to-video (V2V) generation, the conditioning inputs to the Reasoner tower—text prompts and, where applicable, conditioning images or videos—are fixed for the duration of the sampling trajectory. As a result, the Reasoner’s outputs are invariant across diffusion steps and depend only on the conditioning, not on the current noise level or partially denoised sample. We exploit this property by computing the Reasoner forward pass once at the start of inference and caching its outputs for reuse across all subsequent denoising steps. Because the cached activations are mathematically identical to those that would be recomputed at each step, this optimization yields a substantial reduction in per-step latency without any impact on generation quality.

#### Batching.

Inference throughput can be further improved by batching multiple samples into a single forward pass, amortizing per-step overheads (kernel launches, weight reads, and collective communication) across a larger volume of useful work. Our inference batcher reuses the variable-length sequence-packing mechanism developed for training: rather than padding shorter sequences to a common length—which wastes both compute and memory on padding tokens—it concatenates samples of heterogeneous shapes into a single packed tensor and supplies the corresponding cumulative sequence-length metadata to attention and other shape-sensitive operators. The user specifies one of two budgeting modes: a total token budget (the maximum number of tokens allowed within a batch) or a fixed sample count. Given the chosen budget, the batcher greedily packs incoming samples until the budget is exhausted while respecting any per-device memory constraints. This design improves GPU utilization in throughput-oriented deployments such as offline corpus generation and large-scale evaluation, but provides no benefit in latency-bound settings (\eg, robotics workloads) where a single sample must be processed in isolation; in those regimes, the batcher is configured with a sample count of one and effectively disabled.

Tab. 9 reports the inference throughput obtained by request batching on the text-to-video (T2V) task with 189-frame outputs. At 256p, batching yields throughput gains of $8\%$ to $55\%$. The benefits diminish at 480p, where each sample already provides sufficient work to saturate the GPU and leaves limited headroom for additional parallelism. At 720p, the $74{,}000$ context window admits only $B{=}1$, precluding any batching speedup.

> Table 9: **Inference speedup from batching** . The **Cosmos3-Nano** and **Cosmos3-Super** are evaluated on the text-to-video (T2V) task with 189-frame outputs. We report results at 256p and 480p, using maximum admissible batch sizes of $B=6$ and $B=3$, respectively, under the 74k-token context limit. 720p is omitted, as it admits only $B=1$ within the same budget.

| **HW Backend** | **Cosmos3-Nano** |   | **Cosmos3-Super** |   |
|---|---|---|---|---|
|   | **T2V-256** | **T2V-480** | **T2V-256** | **T2V-480** |
| H100 80GB | $8\%$ | $2\%$ | $55\%$ | $5\%$ |
| GB200 | $40\%$ | $2\%$ | $9\%$ | $1\%$ |

#### Generation with prompt upsampling.

Inference additionally supports a prompt-upsampling mode (see more details in Sec. 6.3.2) in which a short, free-form user prompt is expanded by the Reasoner into a richer, structured JSON description of the desired output (covering, for example, scene composition, subject attributes, camera and motion specifications, lighting, and style). The upsampled description is generated autoregressively by the Reasoner and is then supplied to the Generator as an additional conditioning input, alongside any image, video, or action conditioning provided by the user, to synthesize the final output. This pipeline serves two purposes: it offloads the burden of detailed prompt engineering from the end user to the model itself, consistently improving downstream generation quality, and it exercises the full omnimodal end-to-end across both Reasoner and Generator pathways within a single inference invocation—demonstrating that two pathways can be composed seamlessly to produce high-fidelity multimodal outputs from a minimal user specification.

#### Throughput vs serving considerations.

Inference workloads generally optimize for one of two competing objectives: throughput or latency. Batch inference, in which a large set of outputs is generated for a fixed corpus of inputs, is typically optimized for throughput, since end-to-end wall-clock time and aggregate cost are the metrics of interest. In contrast, latency-sensitive applications such as robotics—where actions must be produced from a specific starting context with tight per-step deadlines—prioritize responsiveness, and the relevant metric is time-to-first-token (or time-to-first-action) and per-step latency. The optimizations described above target these regimes differentially: distributed inference (context parallelism and CFG parallelism) primarily reduces latency by parallelizing a single request across multiple devices, whereas batching primarily improves throughput by amortizing per-step overheads across multiple concurrent requests. The remaining optimizations—torch compile, and reasoner-output caching—benefit both regimes simultaneously.

### 5.3.2 Inference Frameworks for Reasoner: vLLM and TensorRT-LLM

Because the Nano and Super Reasoners are built on the Qwen3-VL (Bai et al., 2025b) backbone, their integration into vLLM and TensorRT-LLM reuses the upstream Qwen3-VL support already present in both frameworks. This allows us to inherit, out of the box, the optimized attention kernels, paged KV-cache management, continuous batching, and multimodal input handling that the two backends already provided for the Qwen3-VL family, requiring only minimal configuration changes to bind the Cosmos 3 model weights and tokenizer to the existing execution paths.

The Edge Reasoner, in contrast, is built on a custom Nemotron backbone (NVIDIA, 2025f), which is not natively supported in vLLM. We therefore implemented a dedicated integration that follows the vLLM model-contributor conventions. This integration is structured to be upstreamable, easing future maintenance and enabling community contributions.

### 5.3.3 Inference Frameworks for Generator: vLLM-Omni

Cosmos 3 Generator is integrated into vLLM-Omni to leverage its optimized serving stack for diffusion-based multimodal generation. The integration implements Cosmos 3 Generator as a first-class vLLM-Omni model and supports the full set of Generator modalities, including image, video, audio, and action-conditioned generation. It follows the model-contributor conventions and coding style of the vLLM-Omni framework, making the implementation compatible with the framework’s existing scheduling, distributed execution, memory-reduction, and quantization features.

This integration is particularly important for Generator serving because diffusion-based generation requires many repeated transformer evaluations over large image, video, or multimodal token sequences. The vLLM-Omni backend therefore focuses on reducing per-step latency, lowering peak memory usage, and improving throughput while preserving generation quality. The Cosmos 3 Generator integration supports the following vLLM-Omni features:

- *Cache-DiT.* A training-free acceleration method that reuses cached transformer-block outputs across adjacent denoising steps, allowing redundant computation to be skipped with negligible impact on generation quality.

- *Ulysses context parallelism.* A context-parallel execution scheme that shards long image and video token sequences across multiple GPUs and uses all-to-all attention communication to reduce per-device memory usage and improve latency.

- *CFG-Parallel.* A parallelization strategy for classifier-free guidance that dispatches the conditional and unconditional forward passes to separate GPU ranks. The two predictions are synchronized once per denoising step to form the guided update, reducing the latency of CFG-based sampling.

- *HSDP.* A memory-efficient distributed inference mode that shards transformer weights across GPUs using FSDP2 and gathers parameters on demand during the forward pass, reducing peak GPU memory requirements for large Generator models.

- *CPU offload.* A layer-wise offloading mechanism that moves model parameters between CPU and GPU memory during inference, trading additional data-transfer overhead for substantially lower peak GPU memory usage.

- *VAE-Patch-Parallel.* A parallel VAE execution mode that partitions latent or pixel tensors into spatial tiles and encodes or decodes them across multiple ranks, reducing both per-device memory consumption and VAE latency.

- *Quantization.* A dynamic FP8 quantization path that lowers the precision of dominant compute operations to reduce inference latency and peak GPU memory usage while maintaining acceptable generation quality.

Together, these features allow Cosmos 3 Generator to scale from memory-constrained single-GPU deployments to high-throughput multi-GPU serving. Cache-DiT and quantization reduce the cost of repeated denoising computation, context parallelism and CFG-Parallel improve latency by distributing a single request across GPUs, and HSDP, CPU offload, and VAE-Patch-Parallel reduce memory pressure for large-resolution or long-duration generation tasks. Figure 16 summarizes Cosmos3 serving performance by comparing single-GPU runs on different hardware backends as well as comparing multi-GPU runs on B200s. The evaluation is done for PyTorch-OSS and vLLM-Omni frameworks.

![Figure 16](figures/cosmos3_serving_latency_combined_1x3.svg)

> Figure 16: **Cosmos 3 serving performance. (a) Cosmos3-Nano 720p T2V 1-GPU latency on H100 NVL and B200, to observe performance on different hardware backends. (b) Cosmos3-Nano 720p T2I 1-GPU latency on H100 NVL and B200, to observe performance on different hardware backends. (c) 720p T2V latency scaling on B200 from 1 to 8 GPUs for Cosmos3-Nano and Cosmos3-Super. Lower is better throughout.**

## 5.4 Benchmark Infrastructure

The Cosmos benchmark system manages evaluation jobs for Cosmos models and stores both generated artifacts and evaluation results. An orchestration layer schedules generation, scoring, and endpoint evaluation jobs on Lepton or Slurm clusters and tracks the execution status of each stage. For every run, the system records metadata including the model checkpoint, code version, selected benchmarks, generation settings, benchmark-specific parameters, and associated datasets. Together, these records establish full traceability between each reported score and the exact model weights, inputs, parameter configurations, and evaluation code used to produce it.

The system supports the heterogeneous benchmark suite described in Sec. 6 without requiring all benchmarks to share a common implementation. Benchmarks evaluate generated video, audio, action trajectories, and text responses from reasoner models across a diverse set of criteria, including visual fidelity, audio quality, audio-visual synchronization, prompt and control adherence, action or trajectory accuracy, task completion, physical plausibility, and reasoning correctness. Evaluators include integrations with open-source libraries and public benchmark suites, as well as custom evaluators developed specifically for Cosmos. Scoring methods span reference-based error metrics, perceptual and temporal consistency measures, audio-video alignment metrics, VLM-based judges, human annotations, and exact-match or numeric-answer evaluation.

For Generator evaluation, benchmarking is separated into generation and scoring stages. Generation jobs execute models using either the PyTorch inference pipeline or one of the serving frameworks described in Sec. 5.3, and write generated outputs to object storage. Scoring jobs subsequently consume these stored artifacts, compute per-sample and aggregate metrics, and record results together with run metadata. This decoupled design allows outputs to be rescored with new metrics or evaluators without rerunning generation.

For Reasoner evaluation, we use the VLMEvalKit (Duan et al., 2024) framework together with vLLM. These jobs send prompts and multimodal inputs to deployed model endpoints, process model responses, and record benchmark scores and associated metadata.

Evaluation scores and run metadata are stored in a relational database, while generated artifacts are stored in object storage. Human-evaluation annotations are stored together with the evaluated artifacts and question sets, and aggregate human-evaluation results are tracked alongside automated metrics. A benchmark portal provides access to these records through dashboards, leaderboards, example-level inspection tools, and model-to-model or checkpoint-to-checkpoint comparisons.
