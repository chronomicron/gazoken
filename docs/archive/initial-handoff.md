# Gazoken — Project Handoff and Research Brief

This document transfers the context, decisions, and intended direction of **Gazoken**, a new image forensics research project. It is intended to be pasted into another GPT conversation so work can continue without repeating the initial discussion.

The project is currently in the **concept and research planning stage**. We have agreed on its name, laboratory identity, broad purpose, and investigative philosophy. We have **not yet selected a software architecture, implementation stack, detector models, datasets, or hosting platform**.

## 1. Project identity

### Main name

**ガゾケン · GAZOKEN**  
**Image Forensics Workbench**

The working English spelling is **Gazoken**, without a macron. The Japanese branding is **ガゾケン**.

The name follows a Japanese-style abbreviation process: combining shortened portions of longer words, similar to how *Pocket Monsters* became *Pokémon*.

Its principal derivation is:

- **画像 — gazō:** image, especially a digital image.
- **研究 — kenkyū:** research or systematic investigation.

Thus:

**Gazō + Kenkyū → Gazoken**

We also want the ending **ken** to carry an intentional secondary association with:

- **検証 — kenshō:** verification, examination, or testing a claim against evidence.

These associations express the two sides of the project:

| Association | Role in Gazoken |
|---|---|
| **研究 — Research** | Investigating image traces, developing methods, experimenting with detectors. |
| **検証 — Verification** | Applying those methods to examine an image and assess evidence of modification. |

An important linguistic correction from the discussion: **研究 and 検証 do not share the same first kanji**. Their first syllable sounds the same, but **研** and **検** are different characters. The branding deliberately uses the phonetic overlap.

We should describe this as an intentional coined name with two associations, rather than claim it is an established Japanese technical term.

### Subtitle

The agreed English subtitle is:

**Image Forensics Workbench**

The user particularly liked this phrase. It accurately describes a collection of investigative tools without implying that the system can always deliver a definitive authenticity verdict.

A Japanese rendering discussed was:

**画像フォレンジック・ワークベンチ**

This is a working translation; bilingual terminology can be refined as the project develops.

### Laboratory identity

The research group is:

**グルー研究室 · Grou-lab**

An alternative romanized presentation is:

**グルー研究室 · Gu Ru Kenkyūshitsu**

The name derives from the user’s family name, **Grou**, pronounced in French. The user confirmed that **グルー** is the correct katakana spelling.

The project should feel as though it belongs to a Japanese research laboratory—**研究室, kenkyūshitsu**—rather than simply using a Japanese-sounding product name.

The user explicitly stated that **publications will have both English and Japanese**.

A suitable overall identity is:

> **ガゾケン · GAZOKEN**  
> **Image Forensics Workbench**  
> **グルー研究室 · Grou-lab**

No logo, colour palette, typography, or visual design has yet been selected.

## 2. Core concept

Gazoken is a **Swiss army knife for image investigation**.

The primary use case is:

1. A user uploads an image.
2. Gazoken makes a suite of investigative tools available.
3. The user applies tools to examine different aspects of the image.
4. Results reveal and visualize potentially meaningful traces.
5. The user assesses whether those traces suggest modification, synthetic content, concealed information, or ordinary camera and processing behaviour.

The user described the goal as looking for:

- Artefacts.
- Man-made or artificial additions.
- Non-random structures.
- Evidence of image doctoring.
- Evidence of editing or modification.
- AI-generated or AI-modified content.
- Hidden messages or embedded information.
- Other changes that may not be obvious from ordinary viewing.

The project’s starting assumption is:

> **Treat the submitted image as a purported camera-origin image and investigate whether its contents or file have been altered.**

This assumption is a working hypothesis, not a fact established merely by uploading the image. A fully synthetic image is also within the broader investigative scope.

A concise framing established during the discussion was:

> **Assuming this image originated from a camera, what traces suggest that its contents have been altered, generated, or concealed?**

## 3. What Gazoken should help investigate

Gazoken’s scope is broader than a binary “AI or real” detector.

It should help examine several related but distinct questions:

### Origin

- Is the image consistent with a camera acquisition process?
- Does it contain evidence associated with synthetic generation?
- Does available metadata support or contradict its claimed origin?
- Has the image passed through processing steps that obscure its origin?

### Modification

- Has anything been added?
- Has anything been removed?
- Have objects or regions been copied, moved, replaced, or blended?
- Are different parts of the image inconsistent with one another?
- Are there signs of local enhancement, retouching, or AI-assisted editing?

### Processing history

- Has the image been recompressed?
- Has it been resized, rotated, cropped, sharpened, or denoised?
- Do different regions appear to have different processing histories?
- Can ordinary processing account for apparent anomalies?

### Concealed information

- Are there suspicious structures in channels or bit planes?
- Is there evidence of embedded data or steganography?
- Can a payload be extracted?
- If extracted, can it be interpreted or decoded?

These questions should remain separate in the interface and reporting. Evidence for recompression, for example, does not automatically establish deceptive content editing.

## 4. Investigative philosophy

The intended product is a **workbench for finding, visualizing, and interpreting evidence**.

It should support investigation rather than rely solely on a single unexplained authenticity score.

Useful results would show:

- What the tool measured.
- Where the relevant trace appears.
- How the visualization was produced.
- What interpretations are plausible.
- What ordinary processes might produce a similar result.
- What the tool cannot establish.

The overall direction is to make the image inspectable through multiple complementary methods.

### Non-random does not automatically mean doctored

A central distinction raised during the discussion is that authentic camera images already contain artificial and non-random structures.

Examples include:

- Sensor-related patterns.
- Colour filter array and demosaicing effects.
- JPEG compression structure.
- Sharpening.
- Denoising.
- In-camera computational processing.

Therefore, Gazoken should distinguish between:

1. Expected traces of camera acquisition and ordinary processing.
2. Unexplained inconsistencies.
3. Traces that provide stronger support for a particular modification hypothesis.

This distinction should guide both research and presentation.

### Local inconsistencies are especially relevant

An image may contain regions with different noise, blur, compression, or edge characteristics. Those differences can be investigative clues.

However, natural scene differences can also create local variation:

- Depth of field.
- Subject motion.
- Lighting.
- Surface texture.
- Exposure.
- Contrast.
- Lens behaviour.

The research should determine when an apparent inconsistency remains meaningful after accounting for such factors.

## 5. Broad tool families discussed

The following categories were identified at a conceptual level. They are **not a finalized implementation checklist**.

| Tool family | Intended investigative purpose |
|---|---|
| **Camera and file traces** | Examine metadata, compression history, sensor noise, and acquisition clues. |
| **Local inconsistencies** | Compare blur, noise, lighting, edge structure, and colour across regions. |
| **Editing traces** | Investigate cloning, splicing, object removal, and added content. |
| **Synthetic content** | Examine possible AI generation or AI-assisted editing. |
| **Hidden information** | Inspect channels, bit planes, embedded payloads, and steganographic patterns. |

These categories can overlap. One tool may inform several hypotheses, and one hypothesis may require several tools.

## 6. Hidden messages and steganography

The user explicitly wants Gazoken to investigate whether an image contains hidden messages.

The desired progression is:

1. **Detect suspicious evidence**, where possible.
2. **Identify or characterize a likely embedding mechanism**, where possible.
3. **Extract a suspected payload**, where possible.
4. **Decode or interpret the extracted content**, where possible.

The user’s wording included “decipher them if possible,” but the project should distinguish several operations:

| Operation | Meaning |
|---|---|
| **Detection** | Find evidence suggesting concealed information. |
| **Extraction** | Recover embedded bytes or another payload representation. |
| **Decoding** | Interpret a known encoding or data format. |
| **Decryption** | Recover plaintext from encrypted content, generally requiring the appropriate key or a specific exploitable weakness. |

Failure to recover a readable message does not automatically mean no hidden information exists. Conversely, an unusual statistical pattern alone does not establish that a message was embedded.

No particular steganography tool, algorithm, or supported format has yet been chosen.

## 7. Prior research idea relevant to Gazoken: threshold-sweep edge analysis for blur

An earlier conversation in this project included a specific research idea from the user that is relevant to Gazoken.

The user has prior experience researching image noise and manipulation detection, including combining multiple detectors or “experts.”

One proposed expert would examine **regional blur through edge detection across a range of thresholds**.

### User’s original idea

Rather than apply an edge detector at only one threshold:

1. Apply an edge detector at a low threshold.
2. Measure how many edges are detected.
3. Increase the threshold.
4. Repeat across a threshold range.
5. Perform this analysis over image regions.
6. Compare regional edge responses to identify differences that might indicate different blur characteristics.

The user described thresholds running from **0 to 255**. That was the conceptual range discussed; an implementation must define the edge operator, gradient scaling, and threshold units before adopting that range literally.

The motivation is that blur tends to weaken or smooth edges, affecting their response across thresholds.

### Possible formalization

For a region \(R\), define an edge-response curve:

\[
E_R(t)=
\frac{\text{number of pixels in }R\text{ whose edge strength exceeds }t}
{\text{number of pixels in }R}
\]

Here, \(t\) is the edge-strength threshold.

Comparing these curves could provide more information than comparing a single edge count.

Possible summaries to investigate include:

- Edge density at selected thresholds.
- Area under the threshold-response curve.
- Distribution of edge strengths.
- Rate at which edge density falls as the threshold increases.
- Differences between neighbouring or otherwise comparable regions.

These are proposed ways to formalize the user’s idea; no algorithm has yet been implemented or validated.

### Important research limitation

Low edge density may reflect a smooth or low-texture surface rather than blur. Different scene content, contrast, lighting, and noise can also change the threshold-response curve.

This expert would therefore need appropriate controls and should contribute evidence alongside other methods.

Its intended role is:

> **A regional blur-consistency expert within a broader image investigation workbench.**

The phrase “dynamic threshold edge detection” was used informally in the earlier discussion. **Threshold-sweep edge analysis** may describe the proposed procedure more precisely, since the concept involves evaluating many thresholds.

## 8. User’s relevant technical background

The user is a **firmware/ASIC engineer with a PhD in electrical engineering** and experience in image-related research.

Relevant background mentioned in earlier conversations includes:

- Image noise identification.
- Combining multiple detectors or experts.
- Investigating JPEG-related artefacts using image rotation and angle histograms, including peaks around 90 degrees.
- Regional blur analysis using edge detector threshold sweeps.

The JPEG-related description is historical context, not a sufficiently specified algorithm. A future conversation should ask the user to elaborate before documenting it as an implementation method.

The user can engage with mathematical, signal-processing, and engineering details. The project should support that depth while remaining understandable to someone using the eventual website.

## 9. Intended website experience

The confirmed interaction is straightforward:

> **Upload an image, then choose from a suite of tools to investigate it.**

A reasonable interpretation of the workbench concept is that the original image remains the common reference while the user explores different analyses.

The following interface ideas are natural extensions, but **have not yet been approved as requirements**:

- Side-by-side original and processed views.
- Analysis overlays.
- Region selection.
- Zoom and pixel inspection.
- Tool parameter controls.
- Per-tool explanations.
- A record of analyses performed.
- Exportable findings.

These should be treated as design proposals for later discussion.

Similarly, we have not decided whether tools run:

- In the browser.
- On a server.
- Locally on the user’s computer.
- Through a hybrid architecture.

## 10. Research and validation needs

Because this is a research project, each tool should eventually be evaluated against known examples.

The following is a proposed research framework, not an already agreed experimental protocol.

### Establish what each tool claims to detect

For each method, define:

- The target trace or manipulation.
- Required assumptions.
- Supported image formats.
- Relevant image quality constraints.
- Whether the output is global or localized.
- Known confounding factors.
- What a positive or negative result actually means.

### Use controlled comparisons

Potential test material includes:

- Original camera images.
- Images subjected to ordinary processing.
- Images with known local edits.
- Images with known synthetic additions.
- Fully synthetic images.
- Images containing known embedded payloads.
- Images without payloads but with similar visual or statistical properties.

### Separate ordinary processing from content alteration

A useful evaluation should include benign transformations such as:

- Resizing.
- JPEG recompression.
- Cropping.
- Rotation.
- Sharpening.
- Denoising.
- Colour adjustment.

Otherwise, a detector may merely identify processing rather than the specific modification it claims to detect.

### Evaluate complementary tools carefully

The Swiss army knife concept encourages multiple methods, but several tools may respond to the same underlying trace.

Agreement between correlated detectors should not automatically be treated as independent confirmation.

No scoring or evidence-fusion system has yet been selected.

## 11. Bilingual research and publication direction

The user explicitly wants publications in **English and Japanese**.

The laboratory identity should support:

- English and Japanese project descriptions.
- Consistent terminology.
- Bilingual publication titles and abstracts.
- Documentation of methods and experiments.
- Clear attribution to **グルー研究室 · Grou-lab**.

We have not decided whether the entire website interface must be bilingual at launch. That is a separate scope decision from bilingual publications.

A useful future task would be to establish a short terminology glossary so that concepts such as manipulation, verification, artefact, noise residual, and steganography are translated consistently.

## 12. Naming history and resolved decisions

Several naming directions were explored before choosing Gazoken.

Initial English candidates included:

- PixelSleuth.
- RasterScope.
- ImageInquest.
- PixelProbe.
- ImageAutopsy.
- LatentLens.
- PixelTrace.
- RasterReveal.
- ImageStrata.
- The Pixel Lab.

Acronym ideas included:

- PRISM.
- LIRA.
- IRIS.
- TRACE.

The user preferred a Japanese laboratory identity and a Japanese-style shortened compound.

Japanese or Japanese-inspired possibilities included:

- Gazotan.
- Pikutan.
- Gazoken.
- Mienai.
- Mitoosu.
- Zōken.
- Pikuken.

Alternative Japanese terms for image or picture were discussed, including:

- **画像 — gazō:** digital image.
- **写真 — shashin:** photograph.
- **絵 — e:** picture, drawing, or painting.
- **映像 — eizō:** visual imagery, commonly video.
- **像 — zō:** image, figure, or optical representation.
- **ピクチャー — pikuchā:** borrowed “picture.”
- **イメージ — imēji:** image, often an impression or mental concept.

**Gazō** was selected because it fits technical work across photographs, synthetic images, scans, and other digital imagery.

The settled direction is **Gazoken**. There is no need to restart naming unless the user requests it or availability research reveals a practical issue.

No domain, trademark, repository-name, or existing-project-name availability check has yet been performed. The name should not be described as verified unique.

## 13. Confirmed decisions versus open questions

### Confirmed

- **Project name:** Gazoken.
- **Japanese branding:** ガゾケン.
- **Subtitle:** Image Forensics Workbench.
- **Laboratory:** グルー研究室 · Grou-lab.
- **Laboratory name origin:** the user’s French-pronounced family name, Grou.
- **Name associations:** gazō + kenkyū, with a secondary association with kenshō.
- **Product concept:** a Swiss army knife for image investigation.
- **Primary interaction:** upload an image and apply a suite of tools.
- **Investigation scope:** artefacts, modifications, additions, AI content, and concealed information.
- **Starting hypothesis:** examine a purported camera-origin image for evidence of alteration.
- **Publication direction:** English and Japanese.
- **Research philosophy:** reveal and interpret evidence through complementary methods.

### Still open

- First research milestone.
- Minimum viable tool suite.
- Software stack.
- Architecture and execution environment.
- Supported formats and file-size limits.
- Dataset selection.
- Detector and model selection.
- Validation protocol.
- Reporting format.
- Whether the launch interface is bilingual.
- Image retention and upload handling.
- Hosting and deployment.
- Licensing.
- Branding details.
- Domain and name availability.
- How results from multiple tools should be combined, if at all.

## 14. Suggested next steps

These are recommendations for the next conversation, not commitments already made.

1. **Choose the first research question.**  
   For example, begin with regional inconsistencies in camera-origin images, or a small collection of transparent file and signal inspection tools.

2. **Inventory candidate methods.**  
   Record what each method detects, its assumptions, computational cost, implementation availability, and limitations.

3. **Select a small initial tool suite.**  
   Establish a useful workbench before attempting every form of image forensics.

4. **Create a controlled evaluation set.**  
   Include originals, benign processing, and known manipulations.

5. **Develop one research expert in depth.**  
   The user’s threshold-sweep blur idea is a candidate because it connects directly to their prior work.

6. **Define the first website workflow.**  
   Decide what happens after upload, how tools are selected, and how results are compared.

7. **Choose architecture based on tool requirements.**  
   Processing location should follow the actual computational and data-handling needs.

8. **Prepare a bilingual project overview.**  
   Establish the public identity and terminology under Grou-lab.

## 15. Instructions for the receiving GPT conversation

Continue from the decisions in this handoff.

- Treat **Gazoken** as the chosen name.
- Preserve **Image Forensics Workbench** as the subtitle.
- Use **グルー研究室 · Grou-lab** as the laboratory identity.
- Preserve the Japanese laboratory character and bilingual publication direction.
- Understand that this is a broad image investigation project, with AI detection as one component.
- Keep confirmed requirements separate from proposed additions.
- Do not claim that tools, code, datasets, experiments, or a website already exist.
- Do not claim that name availability has been checked.
- Do not imply access to other conversations, project files, or research notes unless they are actually available.
- Preserve the user’s research contributions and distinguish them from newly suggested formalizations.
- Help move from concept toward a concrete research plan and an implementable first workbench.

The central idea to retain is:

> **Gazoken is an image forensics workbench developed by Grou-lab: a suite of tools for investigating the traces left by camera acquisition, image processing, editing, synthetic generation, and concealed information.**