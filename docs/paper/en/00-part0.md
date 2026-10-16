**作者：** NVIDIA Note: Contributors and acknowledgments are listed in Appendix˜G.

#### Abstract

We introduce Cosmos 3, a family of omnimodal world models designed to jointly process and generate language, image, video, audio, and action sequences within a unified mixture-of-transformers architecture. By supporting highly flexible input-output configurations, Cosmos 3 seamlessly unifies critical modalities for Physical AI—effectively subsuming vision-language models, video generators, world simulators, and world-action models into a single framework. Our evaluation demonstrates that Cosmos 3 establishes a new state-of-the-art across a diverse suite of understanding and generation tasks, demonstrating omnimodal world models as scalable, general-purpose backbones for embodied agents. Our post-trained Cosmos 3 models were ranked as the best open-source Text-to-Image and Image-to-Video models by Artificial Analysis, and the best policy model by RoboArena at the time the technical report was written. To accelerate open research and deployment in Physical AI, we make our code, model checkpoints, curated synthetic datasets, and evaluation benchmark available under the Linux Foundation’s OpenMDW-1.1 License at github.com/nvidia/cosmos and huggingface.co/collections/nvidia/cosmos3 . The project website is available at research.nvidia.com/labs/cosmos-lab/cosmos3 .

| Cosmos | github.com/nvidia/cosmos |
|---|---|
| Cosmos-Framework | github.com/nvidia/cosmos-framework |

| Cosmos3-Super | huggingface.co/nvidia/Cosmos3-Super |
|---|---|
| Cosmos3-Nano | huggingface.co/nvidia/Cosmos3-Nano |
| Cosmos3-Super-Text2Image | huggingface.co/nvidia/Cosmos3-Super-Text2Image |
| Cosmos3-Super-Image2Video | huggingface.co/nvidia/Cosmos3-Super-Image2Video |
| Cosmos3-Nano-Policy-DROID | huggingface.co/nvidia/Cosmos3-Nano-Policy-DROID |

| SDG-PhyxSim | huggingface.co/datasets/nvidia/PhysicalAI-WorldModel-Synthetic-Physical-Interaction-Scenes |
|---|---|
| SDG-RobotSim | huggingface.co/datasets/nvidia/PhysicalAI-WorldModel-Synthetic-Embodied-Robot-Scenes |
| SDG-DriveSim | huggingface.co/datasets/nvidia/PhysicalAI-WorldModel-Synthetic-Autonomous-Driving-Scenarios |
| SDG-SynHuman | huggingface.co/datasets/nvidia/PhysicalAI-WorldModel-Synthetic-Digital-Human-Scenes |
| SDG-Warehouse | huggingface.co/datasets/nvidia/PhysicalAI-WorldModel-Synthetic-Warehouse-Operations-Scenes |

| Cosmos-HUE | huggingface.co/datasets/nvidia/Cosmos-HumanEval-v1 |
|---|---|

#### Contents

1. 1 Introduction

2. 2 Model Architecture 2.1 Encoders 2.1.1 Image and Video 2.1.2 Audio 2.1.3 Action 2.2 Token Arrangement and Generation Mode 2.2.1 Token Arrangement 2.2.2 Generation Mode 2.3 Mixture-of-Transformers (MoT) Architecture 2.3.1 Dual-Tower Layer Structure 2.3.2 Dual-Stream Joint Attention 2.4 Multimodal Position Embedding 2.4.1 Position Index Allocation 2.4.2 Absolute Temporal Modulation 2.5 Model Variants

3. 3 Data 3.1 Reasoner Data 3.1.1 Pre-Training 3.1.2 Supervised Fine-Tuning 3.2 Generator Data 3.2.1 Image and Video 3.2.2 Audio 3.2.3 Action

4. 4 Training 4.1 Reasoner Training 4.1.1 Pre-Training 4.1.2 Supervised Fine-Tuning 4.2 Generator Training 4.2.1 Pre-Training 4.2.2 Mid-Training 4.2.3 Text-to-Image Post-Training 4.2.4 Image-to-Video Post-Training 4.2.5 Robot Policy Post-Training

5. 5 Infrastructure 5.1 Data Infrastructure 5.1.1 Large-Scale Data Processing 5.1.2 Embedding Storage and Semantic Retrieval 5.1.3 Dataset Visualization, Inspection, and Debugging 5.2 Training Infrastructure 5.2.1 Data Loader 5.2.2 Attention Implementation 5.2.3 Distributed Training 5.2.4 Selective Activation Checkpointing 5.2.5 Torch Compile for Transformer Blocks 5.2.6 Video Tokenizer 5.2.7 Checkpointing 5.2.8 Throughput Summary 5.3 Serving Infrastructure 5.3.1 Plain PyTorch 5.3.2 Inference Frameworks for Reasoner: vLLM and TensorRT-LLM 5.3.3 Inference Frameworks for Generator: vLLM-Omni 5.4 Benchmark Infrastructure

6. 6 Results 6.1 Reasoner Evaluation 6.2 Generator Evaluation 6.2.1 Image Generation Evaluation 6.2.2 Video Generation Evaluation 6.2.3 Audio Generation Evaluation 6.2.4 Transfer Generation Evaluation 6.2.5 Action Generation Evaluation 6.3 Generator User Guide 6.3.1 Generation Guide 6.3.2 Cosmos 3 Reasoner as Prompt Upsampler

7. 7 Related Work 7.1 World Models for Physical AI 7.2 Multimodal Understanding and Embodied Reasoning 7.3 Video Generation and Visual World Simulation 7.4 Action Modeling, VLAs, and World-Action Models 7.5 Audio and Audio-Visual Generation 7.6 Omnimodels for Understanding and Generation

8. 8 Conclusion

9. A Caption Details A.1 Captioner Models A.2 Image Schema A.3 Video Schema

10. B Default Prompts and Prompt Upsampling Templates for Generator B.1 Upsampler Prompt Template for Cosmos 3 Reasoner B.2 Upsampler Prompt Template for Cosmos3-Super-Text2Image B.3 Upsampler Prompt Template for Cosmos3-Super-Image2Video B.4 Prompt Prefix for Video Transfer B.5 Prompt Template for Action Generation B.6 Cosmos 3 Generator Negative Prompt B.7 Agentic Upsampling for Cosmos3-Super-Text2Image

11. C Synthetic Dataset for Generator Training C.1 SDG-PhyxSim C.2 SDG-RobotSim C.3 SDG-DriveSim C.4 SDG-SynHuman C.5 SDG-Warehouse C.6 Distribution of SDG Datasets C.7 Ablation Study: Impact of SDG Datasets

12. D Cosmos3-Edge LLM Model Training

13. E Additional Ablation Study E.1 How the Reasoner Benefits the Generator E.2 Choice of FPS Control E.3 Audio Data in Pre-Training E.4 Synergy Between Action Modes E.5 Video-Action Consistency

14. F Cosmos-HumanEval Benchmark (Cosmos-HUE)

15. G Contributors and Acknowledgments G.1 Contributors G.2 Acknowledgments

16. References
