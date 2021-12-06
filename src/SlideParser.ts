import { Configuration} from './Configuration';
import { ISlide } from './ISlide';
import frontmatter, { FrontMatterResult } from 'front-matter'
import {separator, verticalSeparator} from './utils'

import EventEmitter from "events"
import TypedEmitter from "typed-emitter"

const trimFirstLastEmptyLine = (s) => {
  let content = s
  content = content.indexOf("\n") === 0 ? content.substr(1) : content
  content = content.indexOf("\r\n") === 0 ? content.substr(2) : content

  content = content.lastIndexOf("\n") === content.length - 1 ? content.substr(0, content.length - 1) : content
  content = content.lastIndexOf("\r\n") === content.length - 2 ? content.substr(0, content.length - 2) : content
  return content
}



const findSlideAttributes = (text: string) => {
  const regex = /<!--[ ]*.slide:(.*)[ ]*-->/gm
  const m = regex.exec(text)
  return m === null
    ? ''
    : m[1].trim()
}

const findTitle = (text: string) => {
  // Rem : ugly but not so bad ?
  const lines = text
    .replace(/^[ ]*/gm, '') // trim space
    .replace(/<!-- .slide:.* -->/gm, '') // remove slide property
    .replace(/^#+/gm, '') // remove title markup
    .replace(/\r\n/g, '\n') // nomalize line return
    .replace(/^\s*\n/gm, '') // remove whitespace lines
    .split('\n')
  return lines[0].trim()
}

interface SlideParserEvents {
  parsed: (frontmatter:FrontMatterResult<Configuration>, slides:ISlide[]) => void
}

export default class SlideParser extends (EventEmitter as new () => TypedEmitter<SlideParserEvents>){

  constructor() {
    super()
  }

  public parse(text: string, doEmit = true) {
    const result = frontmatter<Configuration>(text)
    const slides = this.#parseSlides(result.body)
    if(doEmit) { this.emit('parsed', result, slides) } // dont emit if called for partial document
    return {frontmatter:result, slides}
  }

  
  #parseSlide = (slideContent: string, index: number): ISlide => {
  const verticalSlides = this.#getVerticalSlides(slideContent)
  const currentSlide = verticalSlides[0]
  return {
    ...currentSlide,
    index,
    verticalChildren: verticalSlides.length > 1 ? verticalSlides.slice(1) : []
  }
}


  #parseSlides = (slideContent: string): ISlide[] => {
  const regex = new RegExp(separator, 'gm')
  const slides = slideContent.split(regex)
  // TODO : do dirty remove first or last line !
  return slides.map((s, i) => {

    return this.#parseSlide(trimFirstLastEmptyLine(s), i)

  })
}


  #getVerticalSlides = (slideContent: string): ISlide[] => {
  const regex = new RegExp(verticalSeparator, 'gm')
  const slides = slideContent.split(regex)

  return slides.map((s, i) => {
    const content = trimFirstLastEmptyLine(s)
    return {
      title: findTitle(content),
      index: i,
      text: content,
      verticalChildren: [],
      attributes: findSlideAttributes(content)

    }
  })
}
  





}

