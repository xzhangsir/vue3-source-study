export const TO_DISPLAY_STRING  = Symbol('toDisplayString')
export const CREATE_TEXT  = Symbol('createTextVnode')
export const  CREATE_ELEMENT_VNODE = Symbol('createElementVnode')
export const OPEN_BLOCK = Symbol('open_block')
export const CREATE_ELEMENT_BLOCK = Symbol('create_element_block')
export const FRAGMENT =  Symbol('fragment')


export const helperMap = {
  [TO_DISPLAY_STRING]:'toDisplayString',
  [CREATE_TEXT]:'createTextVnode',
  [CREATE_ELEMENT_VNODE]:'createElementVnode',
  [OPEN_BLOCK]:"open_block",
  [CREATE_ELEMENT_BLOCK]:"create_element_block",
  [FRAGMENT]:'fragment'
}