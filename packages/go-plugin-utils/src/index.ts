import {
    DataType,
    is,
    make,
    Message,
    MutationMethod,
    Param,
    Property,
    QueryService,
    Schema,
    MutationService,
    QueryMethod,
} from '@typerpc/schema'
import { capitalize, lowerCase } from '@typerpc/plugin-utils'
import { ChildProcess, exec } from 'child_process'

export const typeMap: Map<string, string> = new Map<string, string>([
    [make.bool.type, 'bool'],
    [make.int8.type, 'int8'],
    [make.uint8.type, 'uint8'],
    [make.int16.type, 'int16'],
    [make.uint16.type, 'uint16'],
    [make.int32.type, 'int32'],
    [make.uint32.type, 'uint32'],
    [make.int64.type, 'int64'],
    [make.uint64.type, 'uint64'],
    [make.float32.type, 'float32'],
    [make.float64.type, 'float64'],
    [make.nil.type, 'struct{}'],
    [make.str.type, 'string'],
    [make.dyn.type, 'interface{}'],
    [make.timestamp.type, 'time.Time'],
    [make.unit.type, 'error'],
    [make.blob.type, '[]byte'],
])

// Converts the input dataType into a Go representation
export const dataType = (type: DataType): string => {
    if (!is.container(type) && !is.scalar(type)) {
        throw new TypeError(`invalid data type: ${type.toString()}`)
    }

    if (is.scalar(type)) {
        return typeMap.get(type.type)!
    }

    if (is.map(type)) {
        return `map[string]${dataType(type.valType)}`
    }

    if (is.list(type)) {
        return `[]${dataType(type.dataType)}`
    }

    if (is.struct(type)) {
        return type.name
    }

    if (is.structLiteral(type)) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return `struct{${buildProps(type.properties)}}`
    }

    if (is.tuple2(type)) {
        return `(${dataType(type.item1)}, ${dataType(type.item2)}, error)`
    }

    if (is.tuple3(type)) {
        return `(${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, error)`
    }

    if (is.tuple4(type)) {
        return `(${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(
            type.item4,
        )}, error)`
    }

    if (is.tuple5(type)) {
        return `(${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(
            type.item4,
        )}, ${dataType(type.item5)}, error)`
    }

    return 'interface{}'
}

export const scalarFromQueryParam = (paramName: string, type: DataType): string => {
    if (is.scalar(type) !== true) {
        throw new TypeError('invalid type used in get request')
    }
    if (is.scalar(type)) {
        switch (type.type) {
            case 'bool':
                return `strconv.ParseBool(${paramName})`
            case 'blob':
                return `[]byte(${paramName})`
            case 'float32':
                return `strconv.ParseFloat(${paramName}, 32)`
            case 'float64':
                return `strconv.ParseFloat(${paramName}, 64)`
            case 'int8':
                return `strconv.ParseInt(${paramName}, 0, 8)`
            case 'uint8':
                return `strconv.ParseUint(${paramName}, 0, 8)`
            case 'int16':
                return `strconv.ParseInt(${paramName}, 0, 16)`
            case 'uint16':
                return `strconv.ParseUint(${paramName}, 0, 16)`
            case 'int32':
                return `strconv.ParseInt(${paramName}, 0, 32)`
            case 'uint32':
                return `strconv.ParseUint(${paramName}, 0, 32)`
            case 'int64':
                return `strconv.ParseInt(${paramName}, 0, 64)`
            case 'uint64':
                return `strconv.ParseUint(${paramName}, 0, 64)`
            case 'str':
                return `${paramName}`
            case 'timestamp':
                return `strconv.ParseUint(${paramName}, 0, 64)`
        }
    }
    return ''
}

export const handleOptional = (isOptional: boolean): string => (isOptional ? '*' : '')

export const buildProps = (props: ReadonlyArray<Property>): string => {
    let properties = ''
    for (const prop of props) {
        properties = properties.concat(
            `${capitalize(prop.name)}  ${handleOptional(prop.isOptional)}${dataType(prop.type)} \`json:"${lowerCase(
                prop.name,
            )}"\`\n`,
        )
    }
    return properties
}

export const buildType = (type: Message): string => {
    return `
type ${capitalize(type.name)} struct {
    ${buildProps(type.properties)}
}
`
}

export const buildTypes = (messages: ReadonlyArray<Message>): string => {
    let types = ''
    for (const msg of messages) {
        types = types.concat(buildType(msg))
    }
    return types
}

export const buildMethodParams = (params: ReadonlyArray<Param>): string => {
    let parameters = ''
    let i = 0
    while (i < params.length) {
        const useComma = i === params.length - 1 ? '' : ', '
        parameters = parameters.concat(
            `${lowerCase(params[i].name)} ${handleOptional(params[i].isOptional)}${dataType(
                params[i].type,
            )}${useComma}`,
        )
        i++
    }
    return parameters
}

export const buildReturnType = (type: DataType): string => {
    if (is.dataType(type) !== true) {
        throw new TypeError(`invalid data type: ${type.toString()}`)
    }
    if (is.scalar(type) && type.type === 'unit') {
        return 'error'
    }
    if (is.tuple2(type) || is.tuple3(type) || is.tuple4(type) || is.tuple5(type)) {
        return dataType(type)
    }
    return `(${dataType(type)}, error)`
}

export const buildMethodSignature = (method: MutationMethod | QueryMethod): string => {
    return `
  ${capitalize(method.name)}(ctx context.Context${method.hasParams ? ', ' : ''}${buildMethodParams(
        method.params,
    )}) ${buildReturnType(method.returnType)}
  `
}

export const buildInterfaceMethods = (methods: ReadonlyArray<MutationMethod | QueryMethod>): string => {
    let signatures = ''
    for (const method of methods) {
        signatures = signatures.concat(buildMethodSignature(method))
    }
    return signatures
}

export const buildInterface = (service: MutationService | QueryService): string => {
    return `
 type ${capitalize(service.name)} interface {
    ${buildInterfaceMethods(service.methods)}
 }
 `
}

export const buildFileName = (fileName: string): string =>
    fileName.includes('-') ? fileName.split('-').join('_') + '.go' : fileName + '.go'

export const buildInterfaces = (schema: Schema): string => {
    let interfaces = ''
    for (const svc of schema.queryServices) {
        interfaces = interfaces.concat(buildInterface(svc))
    }
    for (const svc of schema.mutationServices) {
        interfaces = interfaces.concat(buildInterface(svc))
    }
    return interfaces
}

export const format = (path: string): ChildProcess =>
    exec(`gofmt -w ${path}`, (error, stdout, stderr) => {
        if (error) {
            // eslint-disable-next-line no-console
            console.log(`error: ${error.message}`)
            return
        }
        if (stderr) {
            // eslint-disable-next-line no-console
            console.log(`stderr: ${stderr}`)
            return
        }
        // eslint-disable-next-line no-console
        console.log(`formatting complete: ${stdout}`)
    })