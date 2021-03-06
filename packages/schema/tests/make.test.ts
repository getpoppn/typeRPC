/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Copyright (c) 2020. Gary Becks - <techstar.dev@hotmail.com>
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* eslint-disable new-cap */
import { genSourceFile, typesTestData } from '@typerpc/test-utils'
import { $, internal as _ } from '@typerpc/types'
import { Node, Project, TypeNode } from 'ts-morph'
import { make, StructLiteral, _testing } from '../src'

export const types: { [key: string]: Node | TypeNode } = {}

export const { makeDataType } = _testing

beforeAll(() => {
    const { parseMsgProps } = _testing
    const file = genSourceFile(typesTestData, new Project())
    const type = file.getTypeAliasOrThrow('TestType')
    const props = parseMsgProps(type)
    props.forEach((prop) => {
        types[prop.getName()] = prop.getTypeNodeOrThrow()
    })
})

test('make.struct should return struct with correct name and useCbor values', () => {
    expect(make.struct(types.struct).name).toEqual('SomeStruct')
    expect(make.struct(types.cborType).useCbor).toBeTruthy()
})

test('make.structLiteral should return struct with correct number of properties', () => {
    const literal = make.structLiteral(types.structLiteral, makeDataType) as StructLiteral
    expect(literal.properties.length).toEqual(4)
})

test('make.tuple should return tuples with correct DataTypes', () => {
    const tuple2 = make.tuple(types.tuple2, makeDataType) as $.tuple2<any, any>
    const tuple3 = make.tuple(types.tuple3, makeDataType) as $.tuple3<any, any, any>
    const tuple4 = make.tuple(types.tuple4, makeDataType) as $.tuple4<any, any, any, any>
    const tuple5 = make.tuple(types.tuple5, makeDataType) as $.tuple5<any, any, any, any, any>
    expect(tuple2.item1.type).toEqual(make.int8.type)
    expect(tuple2.item2.type).toEqual(make.int8.type)
    expect(tuple3.item1.type).toEqual(make.int8.type)
    expect(tuple3.item2.type).toEqual(make.int16.type)
    expect(tuple3.item3.type).toEqual(make.uint16.type)
    expect(tuple4.item1.type).toEqual(make.int8.type)
    expect(tuple4.item2.type).toEqual(make.str.type)
    expect(tuple4.item3.type).toEqual(make.bool.type)
    expect(tuple4.item4.type).toEqual(make.timestamp.type)
    expect(tuple5.item1.type).toEqual(make.str.type)
    expect(tuple5.item2.type).toEqual(make.str.type)
    expect(tuple5.item3.type).toEqual(make.dyn.type)
    expect(tuple5.item4.type).toEqual(make.blob.type)
    expect(tuple5.item5.type).toEqual(make.float32.type)
})

test('make.scalar should return the correct scalar type', () => {
    const expectScalar = (type: Node | TypeNode, expected: _.Scalar) =>
        expect(make.scalar(type)?.type).toEqual(expected.type)
    expectScalar(types.int8, make.int8)
    expectScalar(types.uint8, make.uint8)
    expectScalar(types.int16, make.int16)
    expectScalar(types.uint16, make.uint16)
    expectScalar(types.int32, make.int32)
    expectScalar(types.uint32, make.uint32)
    expectScalar(types.int64, make.int64)
    expectScalar(types.uint64, make.uint64)
    expectScalar(types.float32, make.float32)
    expectScalar(types.float64, make.float64)
    expectScalar(types.str, make.str)
    expectScalar(types.timestamp, make.timestamp)
    expectScalar(types.blob, make.blob)
    expectScalar(types.dyn, make.dyn)
    expectScalar(types.unit, make.unit)
    expectScalar(types.nil, make.nil)
})

test('make.map should return $.map with correct keyType and valType', () => {
    const dict = make.map(types.dict, makeDataType) as $.map<any, any>
    expect(dict.keyType.toString()).toEqual('$.int8')
    expect(dict.valType.toString()).toEqual('$.int8')
})

test('make.list should return $.list with correct tsDataType', () => {
    const list = make.list(types.list, makeDataType) as $.list<any>
    expect(list.dataType.toString()).toEqual('$.bool')
})
