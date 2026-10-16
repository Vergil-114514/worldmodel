# Appendix A Caption Details

This appendix details the design of our in-house captioning models and full structured caption schemas used for image and video training data. We train our own models rather than relying on off-the-shelf VLMs to ensure maximum control over the output structure and to prevent hallucinated or missing schema fields. Instead of relying solely on free-form natural-language captions, we organize annotations as JSON objects with predefined semantic fields. This design encourages comprehensive coverage of visual details while keeping the representation consistent and interpretable. The image schema captures static scene properties, including subjects, layout, lighting, aesthetics, style, and spatial composition, while the video schema extends this representation with temporal information such as actions, state changes, transitions, camera motion, and audio cues.

## A.1 Captioner Models

To maximize detail and spatial coverage in our image training data, we employ a quadrant-scan annotation strategy. Each image is divided into four quadrants, and the content within each quadrant—along with the center region—is described independently. This approach is highly effective for capturing multiple distinct subjects and complex layouts, which frequently occur in our dataset but are typically under-described by standard captioning methods.

For video data, we introduce a second annotation pass dedicated exclusively to temporal dynamics. Because motion and state transitions are fundamental to video understanding, this secondary pass comprehensively labels temporal changes across all explicitly tracked visual attributes.

For both our final image and video captioning models, we determined that LoRA fine-tuning of Qwen3-VL-8B provided the optimal balance between benchmark metrics and inference efficiency. For video input, we sample frames at $8$ FPS and set the generation temperature to $0.7$. We also use the default Qwen3-VL minimum and maximum pixel bounds, $131,072$ and $25,165,824$, respectively.

## A.2 Image Schema

We use a structured caption representation for text-to-image training data that captures a broad range of visual attributes, including foreground subjects, scene composition, background elements, lighting, aesthetics, artistic style, camera viewpoint, and cinematographic properties. Rather than relying on dense free-form natural language, captions are represented as JSON objects with predefined semantic fields. This structured representation improves detail recall and annotation consistency while maintaining high precision.

To improve spatial coverage, the captioning pipeline incorporates a quadrant-based scanning mechanism that partitions each image into four spatial quadrants together with a central region. Each region is described independently before being merged into the final caption. This design is particularly effective for images containing multiple distinct subjects, localized interactions, or complex spatial layouts that are often under-described in conventional captioning approaches.

We summarize the schema by semantic category and provide a compact JSON skeleton below.

| Field | Description |
|---|---|
| subjects[] | Per-subject records capturing identity, appearance, spatial placement, pose, clothing, expression, and count-sensitive anatomy fields when applicable. Human or human-like subjects additionally include demographic and facial-attribute fields when visible. |
| subject_details | Open-ended attributes or clarifications that do not fit cleanly into a single subject slot, including free-form fine-grained facial details when useful. |
| background_setting | Global scene context, environment, and background elements. |
| lighting | Illumination conditions, directionality, shadows, and notable lighting effects. |
| aesthetics | Composition, color palette, mood, and repeated visual patterns. |
| cinematography | Framing, camera angle, depth of field, focus behavior, and lens characteristics. |
| style_medium / artistic_style | Medium, rendering style, and artistic treatment. |
| context | High-level narrative or situational context for the scene. |
| text_and_signage_elements[] | Any visible text, its appearance, placement, category, and scene relevance. |
| quadrant_scan | Region-wise scan of the top-left, top-right, bottom-left, bottom-right, and absolute center. |
| comprehensive_t2i_caption | A natural-language summary distilled from the structured fields. |
| resolution / aspect_ratio | Image size metadata used to preserve scale and layout cues. |

The number of entries in subjects and the contents of subject_details vary according to scene complexity.

#### Human and human-like attributes.

For human or human-like subjects, the schema may additionally include:

- clothing

- expression

- gender

- age

- skin_tone_and_texture

- fine-grained facial attributes, such as eye shape, eye color, lip shape, hair color, wrinkles, or moles, typically represented through appearance_details or subject_details

#### Count-sensitive attributes.

If a subject corresponds to a group or cluster of similar entities, the schema may additionally include:

- number_of_subjects

- number_of_arms

- number_of_hands

- number_of_fingers

- number_of_legs

#### Compact JSON skeleton.

To standardize our image annotations and prevent the omission of critical visual details, we enforce a strict, predefined JSON structure. The schema detailed below outlines the specific semantic fields—ranging from background settings to aesthetic style—used to comprehensively capture the static properties of each image.

## A.3 Video Schema

The video caption schema extends the image caption schema with fields that capture temporal information. Shared static attributes, such as subjects, background, lighting, aesthetics, style, and camera viewpoint, follow the image caption schema described above. Here, we focus only on video-specific additions.

The video schema explicitly records how the scene evolves over time. It captures subject-level actions and state changes, global action timelines, temporal segments, transitions between segments, camera motion, and optional audio descriptions. These fields improve the representation of motion, interactions, and temporal continuity, which are not captured by image-only captions.

We summarize the video-specific schema components by semantic category and provide a compact JSON skeleton below.

| Field | Description |
|---|---|
| actions[] | Key visual actions in chronological order. |
| segments | Distinct temporal segments by shot, scene, or meaningful change within the video. |
| transitions | Notable transitions between segments or temporal changes in the video. |
| temporal_caption | Dense description of all temporal changes in the video. |
| resolution / aspect_ratio / duration / fps | Video metadata. |
| audio_description | Description of the audio content in the video. |

The number of entries in actions, segments, and transitions varies according to the temporal complexity of the video. Short or static videos may contain only a few temporal events, while longer videos with multiple scene changes, interactions, or camera movements may require more detailed temporal segmentation.

#### Video-specific fields.

Compared with the image schema, the video schema introduces the following additional components:

- action: subject-level motion or activity.

- state_changes: changes in subject appearance, pose, position, or condition over time.

- camera_motion: temporal camera behavior, such as panning, tilting, zooming, tracking, or handheld motion.

- actions: a time-indexed description of important events in the video.

- segments: temporally localized descriptions of major video intervals.

- transitions: changes between segments, shots, scenes, or subject states.

- temporal_caption: an overall summary of the video’s temporal progression.

- duration and fps: basic video metadata.

- audio_description: optional description of speech, music, sound effects, or ambient audio.

#### Compact video-specific JSON skeleton.

While the image schema captures static scene properties, video annotations require tracking temporal dynamics over time. To avoid redundancy, we use a compact JSON skeleton for video data that intentionally omits static visual attributes covered previously. Instead, the schema detailed below focuses strictly on video-specific semantic fields, such as actions, transitions, camera motion, and audio cues.
