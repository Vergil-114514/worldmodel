# Appendix B Default Prompts and Prompt Upsampling Templates for Generator

This appendix provides the prompt upsampler instruction templates and full negative prompts used at inference time for Cosmos 3 Generator under different conditions. We specify the upsampler in each subsection and the corresponding use case. The sampling configurations that accompany these templates are summarized in Tab. 21.

## B.1 Upsampler Prompt Template for Cosmos 3 Reasoner

The following snippet shows the instruction template used to invoke the Cosmos 3 Reasoner as a prompt upsampler, converting user prompts into the structured JSON schema expected by the Cosmos 3 Generator at inference time (see Sec. 6.3.2 for details).

## B.2 Upsampler Prompt Template for Cosmos3-Super-Text2Image

We use the following instruction template to produce upsampled JSON prompts for post-trained Cosmos3-Super-Text2Image. See 4.2.3 for more details.

## B.3 Upsampler Prompt Template for Cosmos3-Super-Image2Video

The following snippet shows the instruction template used with Claude Opus 4.7 to produce upsampled JSON prompts and per-sample contextual negative prompts for the post-trained Cosmos3-Super-Image2Video model (see Sec. 4.2.4 and Sec. 6.3.1 for more details).

## B.4 Prompt Prefix for Video Transfer

For video transfer tasks, we prefix the user caption with a system prompt that instructs the model to condition generation on visual control signals. Specifically, the following system prompt is prepended via the chat template before the user-provided caption during both training and inference:

## B.5 Prompt Template for Action Generation

For action-related tasks, the model accepts a natural-language description of the intended behavior. The metadata information related to the action and video is populated in the JSON format. This format follows the same structured-caption convention used for video generation, while exposing action-specific fields for camera framing, temporal extent, conditioning frame rate, output resolution, and aspect ratio. The resulting prompt has the following form:

The cinematography.framing field is filled to describe the input or output viewpoints, covering first-person, third-person, wrist-mounted, or concatenated camera views. The action entry spans the full generated clip, with the end time rounded from the measured duration; the top-level duration is truncated to integer seconds to remain consistent with the video JSON-caption format. Aspect ratios are mapped from a fixed set of generator resolutions. The optional idle_frame field indicates how many frames contain no action (idle frames). We omit idle-frame metadata for inverse-dynamics samples as action prediction should strictly follow the video instead of user preferences. Fig. 30 shows a multiview example in which the concatenated camera layout is encoded directly in the JSON prompt. We use Claude-Opus-4.6 for prompt upsampling.

![Figure 30](figures/multiview_droid_16164052.jpg)

> Figure 30: **Multiview action prompt formatting. When multiple viewpoints are available, we concatenate them into a single canvas and attach view-layout metadata in the structured JSON prompt so the model can associate each pixel region with its camera stream.**

## B.6 Cosmos 3 Generator Negative Prompt

We use the following negative prompt for the base Cosmos3-Nano and Cosmos3-Super generators.

## B.7 Agentic Upsampling for Cosmos3-Super-Text2Image

The majority of top (closed-source) text-to-image generation models do some variation of in-the-loop iterative refinement and/or multi-modal reasoning (OpenAI, 2026). The ability for Cosmos 3 models to accept JSON-structured prompts opens a variety of opportunities for fine-grained iterative agentic refinement. We put this to the test in our Artificial Analysis submission. At test-time, we infer Cosmos3-Super-Text2Image via an agentic harness that iteratively upsamples the user prompt, scores the generated image by outlining its flaws/issues (if any) and giving a score between 1 to 10, and re-writes both the positive and negative prompt. The output result is simply the best image of this loop, as per our critic’s overall score. We use at most 2 re-write iterations, and do early stopping if the score is at least 9 and if there are no severe issues highlighted by the critic.

For the first iteration, we use the LLM upsampler template found in Appendix B.2, and an empty negative prompt. The VLM critic prompt template is found in Box B.7. The LLM positive/negative rewriter prompt template is found in Box B.7. For our submission we use GPT-5.5 for caption upsampling and rewriting, and Gemini3.1-Pro for the critic. The harness is, by design, flexible and can accept any LLM/VLM, including Cosmos 3 (reasoning tower) itself. For more information and scripts, please visit the nvidia/Cosmos3-Super-Text2Image HuggingFace repository.

The loop structure is:
