# Provence Guard planning.md

## Detection signals 
> What are your 2+ signals? What does each one measure? What does each signal's output look like (a score between 0–1? a binary flag?), and how will you combine them into a single confidence score?

### 1. Perplexity (predictability of text)

#### What does this measure?
Perplexity aims to measure the variation of word choice of the text. Human text generally makes use of a wider range of vocabulary and variation in text than AI-generated text. 

It is important to note that humans can also write in a more formal, predictable style, which may recieve a lower perplexity score while AI-generated text that is edited by human text may recieve a lower score. 

It will look for
* likelihood of word choice. 
* typos and misspellings
* unusual or unexpected word sequences



#### Output
The output will be a single score that encompasses all of these variables from 0-1 (as representation of % of likelihood of matching AI generated text's perplexity, where 1 is highest confidence of AI generated text.)

### 2. Burstiness (variation in writing)

#### What does this measure?

Human text typically has uneven written patterns in comparision to AI-generated text, which are reliant on patterns to form dentences.

AI models typically have some algorithmic and predictable way to write text, leading to low burstiness. Human text typically has more variation in the way they write, thus leading to a higher burstiness. 

It's important to note that this score may incorrectly classify human writing that is written in a standardize style, such as academic writing. The score may also be manipulated by human manipulation of AI generated text.

Burstiness will measure for variation in the following:

* sentence length
* paragraph length
* sentence structure
* word usage


#### Output
The output will be a single score that encompasses all of these variables from 0-1 (as representation of % of likelihood of matching AI generated text's burstiness, where 1 is highest confidence of AI generated text.)

### Final score calculation:

The final score will be calculated using the previous two scores and the following equation:

$$
(perplexity\ score * 0.5) + (burst\ score * 0.5) = final\ confidence\ score
$$

This formula is used to give equal weight between the two umbrella / detection signals for identifying confidence in AI generated text.

* Scores closer to 1 will lead to a higher likelihood that the text is AI generated.
* Scores closer to 0 will signify text with a higher likelihood that the text is written by humans, the inverse of the likelihood the text is AI generated.

The final output will also include a short summary to why the model thinks the text is AI generated or not. 


## Uncertainty representation
> What does a confidence score of 0.6 mean to your system? How will you map raw signal outputs to a calibrated score? What threshold separates "likely AI" from "uncertain" from "likely human"?

A confidence score of 0.6 signifies that the system is uncertain that the text is human or AI-generated.

| Score threshold | Label        |
| --------------- | ------------ |
| 0 - 0.35        | likely human |
| 0.36 - 0.70     | uncertain    |
| 0.71 - 1        | likely AI    |

## Transparency label design
> What exact text will the label show for a high-confidence AI result? A high-confidence human result? An uncertain result? Write out the three label variants now, before you build the UI.

| Label | Resulting text |
| ----- | -------------- |
| likely human | The text does not showcase strong evidence for the text to be AI generated. The text recieved a score for being <score> % likely to be AI-generated. |
| uncertain | The system is unsure if the provided text is AI generated or not. The text recieved a score for being <score> % likely to be AI-generated. |
| likely AI | Based on the patterns commonly shown with AI-generated content, the text does showcase strong evidence for the text to be AI generated. The text recieved a score for being <score> % likely to be AI generated. | 

Additionally, the reason to why the system chose the score will be summarized and showcased to the user alongside the resulting text and confidence score. 

## Appeals workflow
> Who can submit an appeal? What information do they provide? What does the system do when an appeal is received — what status changes, what gets logged? What would a human reviewer see when they open the appeal queue?

### Who can submit an appeal?
Any user who content is flagged as AI-detected can submit an appeal to revoke the AI-generated content flag on their post. 

### What does this system do upon appeal is recieved?
The appeal is submitted with the following information:
* The user's appeal record, has the user appealed in the past?
* The user's flagged post with the attatched reasoning to why the text is flagged.
* The user's written explaination or additional attatchments to why their post is not AI-generated.
* Timestamp of submission

The post's status will be changed from `classified` to `review`. The AI-generated label will stay until there is a conclusion from the human reviewer.

### What would a human reviewer see when they open the appeal queue?
The human reviewer will see the following information: 
* The user's appeal record, has the user appealed in the past?
* The user's flagged post with the attatched reasoning to why the text is flagged.
* The user's written explaination or additional attatchments to why their post is not AI-generated.
* Timestamp of submission

The reviewer will be able to update the post's status from `review` to:
1. `keep_status`: signifying the reviewer has decided to keep the confidence result.
2. `change_status`: signifying the reviewer has changed the confidence result.

Additionally, the reviewer will be able to change the confidence of the post to `uncertain` or `likely human` if they change the status of the post. 

## Anticipated edge cases
> What types of content will your system handle poorly? Name at least two specific scenarios — not generic risks like "inaccurate detection," but specific cases like "a poem with heavy use of repetition and simple vocabulary that your heuristics might score as AI-generated."

1. Formal writing (such as academic writing) with standardized style will have a harder time to determine if the text is AI-generated or not. Human writing styles that enforce consistency or certain use of grammar/vocabulary commonly found with AI-generated text may accidently raise errors.

2. Short and simple writing with lots of repetition. In this scenario, there is not much material that the system can work with to determine if the text is AI-generated or not. Additionally, forms of writing like poems, lyrics, etc. that make intentionally make use of this short, simple, and repetitve style may recieve higher scores.


## Architecture
> Include the diagram you drew in Milestone 1 (ASCII art is fine) and a 2–3 sentence narrative describing the submission and appeal flows. This section travels with you into Milestones 3–5 as the reference diagram for AI code generation.

![alt text](image.png)

## AI Tool Plan 

### M3 (submission endpoint + first signal)
> Which spec sections you'll provide to the AI tool (hint: your detection signals section + the diagram), what you'll ask it to generate (Flask app skeleton + the first signal function), and how you'll verify the output (test with a few inputs directly before wiring into the endpoint).

### M4 (second signal + confidence scoring)
> Which spec sections you'll provide (detection signals + uncertainty representation + diagram), what you'll ask for (second signal function + scoring logic), and what you'll check (do scores vary meaningfully between clearly AI and clearly human text?).

### M5 (production layer)
> Which spec sections you'll provide (detection signals + uncertainty representation + diagram), what you'll ask for (second signal function + scoring logic), and what you'll check (do scores vary meaningfully between clearly AI and clearly human text?).