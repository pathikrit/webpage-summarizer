import { extract } from '@extractus/article-extractor'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { convert } from 'html-to-text'
import showdown from 'showdown'
import dedent from 'dedent'
import fs from 'node:fs/promises'

const urls = [
  'https://www.whattoexpect.com/toddler/behavior/potty-training-problem-refusing-to-poop.aspx?xid=nl_parenting_20240211_34313723&utm_source=nl&utm_medium=email&utm_campaign=parenting&rbe=&utm_content=edit_20240211&document_id=281628&zdee=gAAAAABlfylsTCGMh4ZFNKAb15_gU-zgnnUKPVd5dQOEpJPQMtuKiZcPGYQqOhFQMD8Rquhq_2tHK7pPVSaQwlGkTumPBWJMk4FKjGm89Oz7yBJAj6EDdLI%3D',
  'https://www.whattoexpect.com/toddler/sleep/toddler-safe-sleep-practices/?xid=nl_parenting_20240210_34308528&utm_source=nl&utm_medium=email&utm_campaign=parenting&rbe=&utm_content=st_top_20240210&document_id=312351&zdee=gAAAAABlfylsTCGMh4ZFNKAb15_gU-zgnnUKPVd5dQOEpJPQMtuKiZcPGYQqOhFQMD8Rquhq_2tHK7pPVSaQwlGkTumPBWJMk4FKjGm89Oz7yBJAj6EDdLI%3D',
  'https://www.whattoexpect.com/baby-products/sleep/best-toddler-pillow?xid=nl_parenting_20240210_34308528&utm_source=nl&utm_medium=email&utm_campaign=parenting&rbe=&utm_content=edit_20240210&document_id=330119&zdee=gAAAAABlfylsTCGMh4ZFNKAb15_gU-zgnnUKPVd5dQOEpJPQMtuKiZcPGYQqOhFQMD8Rquhq_2tHK7pPVSaQwlGkTumPBWJMk4FKjGm89Oz7yBJAj6EDdLI%3D',
  'https://www.whattoexpect.com/community/parenting-trends-youll-see-in-2024?xid=nl_parenting_20240209_34299623&utm_source=nl&utm_medium=email&utm_campaign=parenting&rbe=&utm_content=edit_20240209&document_id=330808&zdee=gAAAAABlfylsTCGMh4ZFNKAb15_gU-zgnnUKPVd5dQOEpJPQMtuKiZcPGYQqOhFQMD8Rquhq_2tHK7pPVSaQwlGkTumPBWJMk4FKjGm89Oz7yBJAj6EDdLI%3D',  
  'https://www.whattoexpect.com/toddler/behavior/masturbating.aspx?xid=nl_parenting_20240209_34299623&utm_source=nl&utm_medium=email&utm_campaign=parenting&rbe=&utm_content=st_top_20240209&document_id=281626&zdee=gAAAAABlfylsTCGMh4ZFNKAb15_gU-zgnnUKPVd5dQOEpJPQMtuKiZcPGYQqOhFQMD8Rquhq_2tHK7pPVSaQwlGkTumPBWJMk4FKjGm89Oz7yBJAj6EDdLI%3D',
  'https://www.whattoexpect.com/baby-growth/predict-height.aspx?xid=nl_parenting_20240208_34284838&utm_source=nl&utm_medium=email&utm_campaign=parenting&rbe=&utm_content=st_top_20240208&document_id=284590&zdee=gAAAAABlfylsTCGMh4ZFNKAb15_gU-zgnnUKPVd5dQOEpJPQMtuKiZcPGYQqOhFQMD8Rquhq_2tHK7pPVSaQwlGkTumPBWJMk4FKjGm89Oz7yBJAj6EDdLI%3D',
  'https://www.whattoexpect.com/toddler/behavior/night-waking.aspx?xid=nl_parenting_20240207_34270933&utm_source=nl&utm_medium=email&utm_campaign=parenting&rbe=&utm_content=st_top_20240207&document_id=281553&zdee=gAAAAABlfylsTCGMh4ZFNKAb15_gU-zgnnUKPVd5dQOEpJPQMtuKiZcPGYQqOhFQMD8Rquhq_2tHK7pPVSaQwlGkTumPBWJMk4FKjGm89Oz7yBJAj6EDdLI%3D',
  'https://www.whattoexpect.com/baby-products/nursery/best-baby-books-newborns-one-year-olds/?xid=nl_parenting_20240204_34232521&utm_source=nl&utm_medium=email&utm_campaign=parenting&rbe=&utm_content=edit_20240204&document_id=328477&zdee=gAAAAABlfylsTCGMh4ZFNKAb15_gU-zgnnUKPVd5dQOEpJPQMtuKiZcPGYQqOhFQMD8Rquhq_2tHK7pPVSaQwlGkTumPBWJMk4FKjGm89Oz7yBJAj6EDdLI%3D',
  'https://www.whattoexpect.com/toddler/behavior/undressing.aspx?xid=nl_parenting_20240205_34243271&utm_source=nl&utm_medium=email&utm_campaign=parenting&rbe=&utm_content=edit_20240205&document_id=284458&zdee=gAAAAABlfylsTCGMh4ZFNKAb15_gU-zgnnUKPVd5dQOEpJPQMtuKiZcPGYQqOhFQMD8Rquhq_2tHK7pPVSaQwlGkTumPBWJMk4FKjGm89Oz7yBJAj6EDdLI%3D',
  'https://www.whattoexpect.com/nursery-decorating/childproofing-basics.aspx?xid=nl_parenting_20231218_33735461&utm_source=nl&utm_medium=email&utm_campaign=parenting&rbe=&utm_content=edit_20231218&document_id=281608&zdee=gAAAAABlfylsTCGMh4ZFNKAb15_gU-zgnnUKPVd5dQOEpJPQMtuKiZcPGYQqOhFQMD8Rquhq_2tHK7pPVSaQwlGkTumPBWJMk4FKjGm89Oz7yBJAj6EDdLI%3D',
]
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

const parseUrl = (url) => extract(url).then(res => Object.assign(res, {text: convert(res.content)}))

const makePrompt = (urlParse) => dedent(`
    I have extracted the following information from this site:
    url: ${urlParse.url},
    title: ${urlParse.title},
    description ${urlParse.description}
    content: ${urlParse.text}

    Please summarize above content into a short Markdown document with relevant sections, sub-sections with bulleted and numbered lists and sub-lists.
    Be very short and succint
    Ignore disclaimers, self-propotions, acknowledgements etc.
`)

class Gemini {
    static API_KEY = 'AIzaSyBx0jD3n1_mhi1oKJCgn_JjbNhLjaDKhT0'
    static llm = new GoogleGenerativeAI(Gemini.API_KEY)
        .getGenerativeModel({
            model: 'gemini-pro',
            safetySettings: [
                {category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE},
                {category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE},
                {category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE},
                {category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE}
            ]
        })
    static ask = (prompt) => Gemini.llm.generateContent(prompt).then(result => result.response)
}

const md2html = new showdown.Converter({tables: true, openLinksInNewWindow: true, completeHTMLDocument: true, metadata: true, moreStyling: true})

for (const [i, url] of urls.entries()) {
    console.log(`Reading ${url} ...`)
    
    const parsed = await parseUrl(url)
    const output = `output/${parsed.title ?? i}.html`.toLowerCase().replace(/ /g,"_")
    await Gemini.ask(makePrompt(parsed))
        .then(response => response.promptFeedback?.blockReason ? `## Failed to read: \`${JSON.stringify(response.promptFeedback)}\`` : response.text())
        .then(doc => `# [${parsed.title ?? parsed.description ?? parsed.url}](${url})\n\n${doc}`)
        .then(md => md2html.makeHtml(md))
        .then(html => fs.writeFile(output, html))
    console.log(`Saved ${output}`)
}
