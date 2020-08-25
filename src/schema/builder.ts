/* eslint-disable new-cap,  @typescript-eslint/no-use-before-define,radix */
// file deepcode ignore semicolon: eslint conflict
import {
  InterfaceDeclaration,
  MethodSignature,
  Node,
  ParameterDeclaration,
  PropertySignature,
  SourceFile,
  TypeNode,
} from 'ts-morph'
import {DataType, is, make, StructLiteralProp} from './types'
import {Schema} from '.'
import {HTTPErrCode, HTTPResponseCode, HTTPVerb, Interface, Method, Param, Property, TypeDef} from './schema'
import {isContainer, isHttpVerb, isMsgLiteral, isValidDataType} from './validator/utils'
import {isErrCode, isResponseCode} from './validator/service'
import {validateSchemas} from './validator'
import {isOptionalProp, parseJsDocComment, parseMsgProps, parseTypeParams} from './parser'

const isType = (type: TypeNode | Node, typeText: string): boolean => type.getText().trim().startsWith(typeText)

const makeList = (type: TypeNode | Node): DataType => make
.List(makeDataType(parseTypeParams(type)[0]))

const makeDict = (type: TypeNode | Node): DataType => {
  const params = parseTypeParams(type)
  const key = make.primitive(params[0])
  if (!key) {
    throw typeError(type, `${type.getText()} is not a valid Dict key type`)
  }
  return make.Dict(key, makeDataType(params[1]))
}

const makeTuple = (type: TypeNode | Node): DataType => {
  const params = parseTypeParams(type)
  switch (params.length) {
  case 2:
    return make.Tuple2(makeDataType(params[0]), makeDataType(params[1]))

  case 3:
    return make.Tuple3(makeDataType(params[0]), makeDataType(params[1]), makeDataType(params[2]))
  case 4:
    return make.Tuple4(makeDataType(params[0]), makeDataType(params[1]), makeDataType(params[2]), makeDataType(params[3]))
  case 5:
    return make.Tuple5(makeDataType(params[0]), makeDataType(params[1]), makeDataType(params[2]), makeDataType(params[3]), makeDataType(params[4]))
  default:
    return make.Tuple2(make.dyn, make.dyn)
  }
}
const typeError = (type: TypeNode | Node, msg: string) =>  new TypeError(`error in file ${type.getSourceFile().getFilePath()}
    at line number: ${type.getStartLineNumber()}
    message: ${msg}`)

const makeDataType = (type: TypeNode | Node): DataType => {
  const typeText = type.getText()?.trim()
  if (!isValidDataType(type)) {
    throw typeError(type, `${typeText} is not a valid typerpc DataType`)
  }
  const prim = make.primitive(type)
  if (prim) {
    return prim
  }
  if (isMsgLiteral(type)) {
    return make.StructLiteral(type, makeDataType)
  }
  if (!isContainer(type)) {
    return make.Struct(type)
  }
  if (isType(type, '$.List')) {
    return makeList(type)
  }
  if (isType(type, '$.Dict')) {
    return makeDict(type)
  }
  if (isType(type, '$.Tuple')) {
    return makeTuple(type)
  }

  return make.dyn
}

// builds the httpVerb for a method using the parsed JsDoc
const buildHttpVerb = (method: MethodSignature): HTTPVerb => {
  const comment = parseJsDocComment(method, 'access') as HTTPVerb ?? 'POST'
  return isHttpVerb(comment) ? comment : 'POST'
}

const buildResponseCode = (method: MethodSignature): HTTPResponseCode => {
  const comment = parseJsDocComment(method, 'returns')  ?? '200'
  const response = parseInt(comment)
  return isResponseCode(response) ? response as HTTPResponseCode : 200
}

const buildErrCode = (method: MethodSignature): HTTPErrCode => {
  const comment = parseJsDocComment(method, 'throws') ?? '500'
  const response = parseInt(comment)
  return isErrCode(response) ? response as HTTPErrCode : 500
}

// gets the type node E.G. (name: type node) of a type alias property
export const getTypeNode = (node: Node) => isOptional(node) ? node.getChildAtIndex(3) : node.getChildAtIndex(2)

// builds all properties of a type alias
const buildProps = (properties: PropertySignature[]): Property[] =>
  properties.map(prop => {
    return {isOptional: isOptionalProp(prop), type: makeDataType(getTypeNode(prop)), name: prop.getName().trim()}
  })

// Converts all type aliases found in schema files into TypeDefs
const buildTypes = (sourceFile: SourceFile): TypeDef[] => {
  const typeAliases = sourceFile.getTypeAliases()
  if (typeAliases.length === 0) {
    return []
  }

  return [...new Set(typeAliases.map(typeDef => {
    return {
      name: typeDef.getNameNode().getText().trim(),
      properties: [...new Set(buildProps(typeDef.getTypeNode()!.forEachChildAsArray())) as ReadonlySet<Property>]}
  }))]
}

const buildParams = (params: ParameterDeclaration[]): Param[] => {
  return [...new Set<Param>(params.map(param => {
    return {
      name: param.getName().trim(),
      isOptional: param.isOptional(),
      type: makeDataType(param.getTypeNode()!),
    }
  }))]
}

const getMethodName = (method: MethodSignature): string => method.getNameNode().getText().trim()

const buildMethod = (method: MethodSignature): Method => {
  return {
    httpVerb: buildHttpVerb(method),
    name: getMethodName(method),
    params: buildParams(method.getParameters()),
    returnType: makeDataType(method.getReturnTypeNode()!),
    responseCode: buildResponseCode(method),
    errorCode: buildErrCode(method),
    get isVoidReturn(): boolean {
      // noinspection JSDeepBugsBinOperand
      return this.returnType === make.unit
    },
    get isGet(): boolean {
      return this.httpVerb.toUpperCase() === 'GET'
    },
    get hasCborParams(): boolean {
      return [...this.params].some(param => is.Struct(param.type) && param.type.useCbor)
    },
    get hasCborReturn(): boolean {
      return is.Struct(this.returnType) && this.returnType.useCbor
    },
    get hasParams(): boolean {
      return this.params.length > 0
    },
  }
}

const buildMethods = (methods: MethodSignature[]): Method[] => [...new Set(methods.map(method => buildMethod(method)))]

export const getInterfaceName = (interfc: InterfaceDeclaration): string => interfc.getNameNode().getText().trim()

const buildInterface = (interfc: InterfaceDeclaration): Interface => {
  return {
    name: getInterfaceName(interfc),
    methods: buildMethods(interfc.getMethods()),
  }
}

const buildInterfaces = (sourceFile: SourceFile): Interface[] => {
  const interfaces = sourceFile.getInterfaces()
  if (interfaces.length === 0) {
    return []
  }
  return [...new Set(interfaces.map(interfc => buildInterface(interfc)))]
}

const buildSchema = (file: SourceFile): Schema => {
  return {
    fileName: file.getBaseNameWithoutExtension(),
    types: buildTypes(file),
    interfaces: buildInterfaces(file),
    get hasCbor(): boolean {
      return this.interfaces.flatMap(interfc => [...interfc.methods]).some(method => method.hasCborParams || method.hasCborReturn)
    },
  }
}

export const buildSchemas = (sourceFiles: SourceFile[]): Schema[] | Error[] => {
  const errs = validateSchemas(sourceFiles)
  return errs ? errs : [...new Set<Schema>(sourceFiles.map(file => buildSchema(file)))]
}

export const internalTesting = {
  isType,
  useCbor,
  buildSchema,
  buildMethod,
  buildParams,
  buildProps,
  buildTypes,
  buildHttpVerb,
  buildErrCode,
  buildResponseCode,
  makeDataType,
}
