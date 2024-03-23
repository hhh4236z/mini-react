import { describe, expect, it } from 'vitest'
import React from '../core/react.js'

describe('test mini-react', () => {
  it('react createElement should be work', () => {
    const app = React.createElement('div', { id: 'hello' }, 'hello', '-', 'world')
    expect(app).toMatchInlineSnapshot(`
      {
        "props": {
          "children": [
            {
              "props": {
                "children": [],
                "nodeValue": "hello",
              },
              "type": "TEXT ELEMENT",
            },
            {
              "props": {
                "children": [],
                "nodeValue": "-",
              },
              "type": "TEXT ELEMENT",
            },
            {
              "props": {
                "children": [],
                "nodeValue": "world",
              },
              "type": "TEXT ELEMENT",
            },
          ],
          "id": "hello",
        },
        "type": "div",
      }
    `)
  })
})
