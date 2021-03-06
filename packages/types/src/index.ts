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

/**
 * defines the type system for typerpc
 *
 */

/* eslint-disable @typescript-eslint/no-namespace */
type scalar = { readonly brand: unique symbol }
type container = { readonly brand: unique symbol }

type returnableScalar = { readonly brand: unique symbol }
type returnableContainer = { readonly brand: unique symbol }

type scalarOrUndefined = scalar | undefined
type containerOrUndefined = container | undefined

type messagable = scalarOrUndefined | containerOrUndefined

export namespace $ {
    import Paramable = internal.Paramable
    export type bool = { type: 'bool'; toString(): string } & scalar
    export type int8 = { type: 'int8'; toString(): string } & scalar
    export type uint8 = { type: 'uint8'; toString(): string } & scalar
    export type int16 = { type: 'int16'; toString(): string } & scalar
    export type uint16 = { type: 'uint16'; toString(): string } & scalar
    export type int32 = { type: 'int32'; toString(): string } & scalar
    export type uint32 = { type: 'uint32'; toString(): string } & scalar
    export type int64 = { type: 'int64'; toString(): string } & scalar
    export type uint64 = { type: 'uint64'; toString(): string } & scalar
    export type float32 = { type: 'float32'; toString(): string } & scalar
    export type float64 = { type: 'float64'; toString(): string } & scalar
    export type str = { type: 'str'; toString(): string } & scalar

    export type timestamp = { type: 'timestamp'; toString(): string } & scalar
    /**
     * Uint8Array in Js. []byte in Go.
     */
    export type blob = { type: 'blob'; toString(): string } & scalar
    /**
     * any type in Ts/Rust, interface{} in go, dynamic in C#/Dart
     */
    export type dyn = { type: 'dyn'; toString(): string } & scalar

    // Primitives, but can't be used as keys for anything
    /**
     * represents the absence of a value. void in C derived most languages.
     * can only be used as a return type.
     */
    export type unit = { type: 'unit'; toString(): string } & returnableScalar
    /**
     * null, can only be used as a return type.
     */
    export type nil = { type: 'nil'; toString(): string } & returnableScalar
    /**
     * map keys can only be $.str due to json restrictions
     */
    export type map<T extends $.str, S extends Paramable> = Readonly<{
        keyType: T
        valType: S
        toString(): string
    }> &
        container
    /**
     * Can only be used as return type, due to golang type system.
     */
    export type tuple2<T extends Paramable, X extends Paramable> = Readonly<{
        item1: T
        item2: X
        toString(): string
    }> &
        returnableContainer
    /**
     * Can only be used as return type, due to golang type system.
     */
    export type tuple3<T extends Paramable, R extends Paramable, S extends Paramable> = Readonly<{
        item1: T
        item2: R
        item3: S
        toString(): string
    }> &
        returnableContainer
    /**
     * Can only be used as return type, due to golang type system.
     */
    export type tuple4<T extends Paramable, R extends Paramable, S extends Paramable, U extends Paramable> = Readonly<{
        item1: T
        item2: R
        item3: S
        item4: U
        toString(): string
    }> &
        returnableContainer
    /**
     * Can only be used as return type, due to golang type system.
     */
    export type tuple5<
        T extends Paramable,
        R extends Paramable,
        S extends Paramable,
        U extends Paramable,
        V extends Paramable
    > = Readonly<{
        item1: T
        item2: R
        item3: S
        item4: U
        item5: V
        toString(): string
    }> &
        returnableContainer

    export type list<T extends Paramable> = Readonly<{
        dataType: T
        toString(): string
    }> &
        container
}

export namespace rpc {
    import RpcType = internal.RpcType
    import QueryParamable = internal.QueryParamable

    type QueryFunc = (...params: (QueryParamable | undefined)[]) => RpcType
    type MutationFunc = (...params: (internal.Paramable | undefined)[]) => RpcType

    /**
     * A service that can handle mutations by using HTTP POST requests.
     *
     * Only valid typerpc QueryParamable types and rpc.Msg can be used as parameters
     * the return type can be any typerpc type or rpc.Msg
     */
    export type Mutation<T extends { [key: string]: MutationFunc }> = T

    /** A service that can handle queries by using HTTP Get requests.
     *
     * Only valid typerpc Paramable types and rpc.Msg can be used as parameters
     * the return type can be any typerpc type or rpc.Msg
     */
    export type Query<T extends { [key: string]: QueryFunc }> = T
    /**
     * Used to construct a type alias a typerpc Type alias.
     * Types defined without using this type are not allowed.
     */
    export type Msg<T extends internal.MsgProps> = T

    /**
     *
     * Used to construct a discriminated union of rpc types
     */
    export type Union<T extends internal.UnionProps> = Readonly<{
        types: T
        toString(): string
    }>
}

export namespace internal {
    type QueryParamableScalar =
        | $.str
        | $.bool
        | $.int8
        | $.uint8
        | $.int16
        | $.uint16
        | $.uint32
        | $.int32
        | $.int64
        | $.uint64
        | $.float32
        | $.float64
        | $.timestamp

    export type Scalar = QueryParamableScalar | $.blob | $.dyn | $.unit | $.nil
    /**
     * Types that are allowed to be used in rpc.Query methods
     * as parameters
     */
    export type QueryParamable = QueryParamableScalar | $.list<QueryParamableScalar>

    export type UnionProps = (messagable | rpc.Msg<MsgProps>)[] | string[]
    export type MsgProps = {
        [key: string]: messagable | rpc.Msg<{ [key: string]: messagable }> | rpc.Union<UnionProps>
    }

    // valid method, generic type params
    export type Paramable = scalar | container | rpc.Msg<MsgProps>
    export type RpcType =
        | Scalar
        | container
        | Paramable
        | returnableContainer
        | rpc.Msg<MsgProps>
        | rpc.Union<UnionProps>
}
