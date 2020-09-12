import { DataType, Message, MutationMethod, MutationService, Param, Property, QueryMethod, QueryService, Schema } from '@typerpc/schema';
export declare const typeMap: Map<string, string>;
export declare const dataType: (type: DataType) => string;
export declare const scalarFromQueryParam: (param: string, type: DataType) => string;
export declare const fromQueryString: (param: string, type: DataType) => string;
export declare const handleOptional: (property: Property) => string;
export declare const buildProps: (props: ReadonlyArray<Property>) => string;
export declare const buildType: (type: Message) => string;
export declare const buildTypes: (messages: ReadonlyArray<Message>) => string;
export declare const buildMethodParams: (params: ReadonlyArray<Param>) => string;
export declare const buildReturnType: (type: DataType) => string;
export declare const buildMethodSignature: (method: MutationMethod | QueryMethod) => string;
export declare const buildInterfaceMethods: (methods: ReadonlyArray<MutationMethod | QueryMethod>) => string;
export declare const buildInterface: (service: MutationService | QueryService) => string;
export declare const parseQueryParams: (params: ReadonlyArray<Param>) => string;
export declare const parseReqBody: (method: MutationMethod | QueryMethod) => string;
export declare const buildParamNames: (method: QueryMethod | MutationMethod) => string;
export declare const buildResultDeclarations: (type: DataType) => string;
export declare const buildResultInitializers: (type: DataType) => string;
export declare const buildResponseStruct: (type: DataType) => string;
export declare const buildFileName: (fileName: string) => string;
export declare const buildInterfaces: (schema: Schema) => string;
export declare const helpers = "\nfunc marshalResponse(v interface{}, isCbor bool) ([]byte, error) {\n\tif isCbor {\n\t\tdata, err := cbor.Marshal(v)\n\t\tif err != nil {\n\t\t\treturn data,NewRpcError(http.StatusInternalServerError, \"failed to marshal cbor response\", err)\n\t\t}\n\t}\n\tdata, err := json.Marshal(v)\n\tif err != nil {\n\t\treturn data, NewRpcError(http.StatusInternalServerError, \"failed to marshal json response\", err)\n\t}\n\treturn data, nil\n}\n\nfunc parseReqBody(r *http.Request, v interface{}, isCbor bool) error {\n\treqBody, err := ioutil.ReadAll(r.Body)\n\tdefer r.Body.Close()\n\tif err != nil {\n\t\treturn NewRpcError(http.StatusInternalServerError, \"failed to read request body\",  err)\n\t}\n\tif isCbor {\n\t\terr := cbor.Unmarshal(reqBody, v)\n\t\tif err != nil {\n\t\t\treturn  NewRpcError(http.StatusBadRequest, \"failed unmarshall cbor request data\", err)\n\t\t}\n\t}\n\terr = json.Unmarshal(reqBody, v)\n\tif err != nil {\n\t\treturn NewRpcError(http.StatusBadRequest, \"failed unmarshall json request data\", err)\n\t}\n\treturn nil\n}\n\nfunc handlePanic(w http.ResponseWriter, isCbor bool) {\n\n\t// If panic occurs, serve a 500 error and then panic.\n\tif rr := recover(); rr != nil {\n\t\tRespondWithErr(w, errors.New(\"internal\"), isCbor)\n\t\tpanic(rr)\n\t}\n\n}\n\ntype ctxKey struct {\n\tkind string\n}\n\nfunc (k *ctxKey) String() string {\n\treturn \"typerpc context value \" + k.kind\n}\n\nvar handlerKey = &ctxKey{\"HTTPHandler\"}\n\nfunc HTTPHandlerName(ctx context.Context) string {\n\treturn ctx.Value(handlerKey).(string)\n}\n\ntype ErrorPayload struct {\n\tCode  int    `json:\"code\"`\n\tCause string `json:\"cause,omitempty\"`\n\tMsg   string `json:\"msg\"`\n\tError string `json:\"error\"`\n}\n\ntype RpcError interface {\n\t// Code is of the valid error codes\n\tCode() int\n\n\t// Msg returns a human-readable, unstructured messages describing the error\n\tMsg() string\n\n\t// Cause is reason for the error\n\tCause() error\n\n\t// RpcError returns a string of the form \"typerpc error <Code>: <Msg>\"\n\tError() string\n\n\t// RpcError response payload\n\tPayload() ErrorPayload\n}\n\ntype rpcErr struct {\n\tcode  int\n\tmsg   string\n\tcause error\n}\n\nfunc NewRpcError(code int, msg string, cause error) *rpcErr {\n\treturn &rpcErr{code: code, msg: msg, cause: cause}\n}\nfunc (e *rpcErr) Code() int {\n\treturn e.code\n}\n\nfunc (e *rpcErr) Msg() string {\n\treturn e.msg\n}\n\nfunc (e *rpcErr) Cause() error {\n\treturn e.cause\n}\n\nfunc (e *rpcErr) Error() string {\n\tif e.cause != nil && e.cause.Error() != \"\" {\n\t\tif e.msg != \"\" {\n\t\t\treturn fmt.Sprintf(\"typerpc %d error: %s -- %s\", e.code, e.cause.Error(), e.msg)\n\t\t} else {\n\t\t\treturn fmt.Sprintf(\"typerpc %d error: %s\", e.code, e.cause.Error())\n\t\t}\n\t} else {\n\t\treturn fmt.Sprintf(\"typerpc %d error: %s\", e.code, e.msg)\n\t}\n}\n\nfunc (e *rpcErr) Payload() ErrorPayload {\n\terrPayload := ErrorPayload{\n\t\tCode:  e.Code(),\n\t\tMsg:   e.Msg(),\n\t\tError: e.Error(),\n\t}\n\tif e.Cause() != nil {\n\t\terrPayload.Cause = e.Cause().Error()\n\t}\n\treturn errPayload\n}\n\nfunc RespondWithErr(w http.ResponseWriter, err error, isCbor bool) {\n\tvar e *rpcErr\n\tif !errors.As(err, &e) {\n\t\te = NewRpcError(http.StatusInternalServerError, \"typerpc error\", err)\n\t}\n\tw.WriteHeader(e.code)\n\tvar respBody []byte\n\tif isCbor {\n\t\t\tw.Header().Set(\"Content-Type\", \"application/cbor\")\n\t\tbody, _ := cbor.Marshal(e.Payload())\n\t\trespBody = body\n\n\t} else {\n\t\tw.Header().Set(\"Content-Type\", \"application/json\")\n\t\tbody, _ := json.Marshal(e.Payload())\n\t\trespBody = body\n\t}\n\tw.Write(respBody)\n}\n\nfunc StringToTimestamp(t string) (time.Time, error) {\n\tparsed, err := strconv.ParseInt(t, 0, 64)\n\tif err != nil {\n\t\treturn time.Time{}, err\n\t}\n\treturn time.Unix(parsed, 0), nil\n}\n\nfunc StringToBool(param string) (bool, error) {\n\ti, err := strconv.ParseBool(param)\n\tif err != nil {\n\t\treturn false, err\n\t}\n\treturn i, nil\n}\n\nfunc StringToBytes(param string) ([]byte, error) {\n\treturn []byte(param), nil\n}\n\nfunc StringToFloat32(param string) (float32, error) {\n\ti, err := strconv.ParseFloat(param, 32)\n\tif err != nil {\n\t\treturn 0, err\n\t}\n\treturn float32(i), nil\n}\n\nfunc StringToFloat64(param string) (float64, error) {\n\ti, err := strconv.ParseFloat(param, 64)\n\tif err != nil {\n\t\treturn 0, err\n\t}\n\treturn i, nil\n}\n\nfunc StringToInt8(param string) (int8, error) {\n\ti, err := strconv.ParseInt(param, 0, 8)\n\tif err != nil {\n\t\treturn 0, err\n\t}\n\treturn int8(i), nil\n}\n\nfunc StringToUint8(param string) (uint8, error) {\n\ti, err := strconv.ParseUint(param, 0, 8)\n\tif err != nil {\n\t\treturn 0, err\n\t}\n\treturn uint8(i), nil\n}\n\nfunc StringToInt16(param string) (int16, error) {\n\ti, err := strconv.ParseInt(param, 0, 16)\n\tif err != nil {\n\t\treturn 0, err\n\t}\n\treturn int16(i), nil\n}\n\nfunc StringToUint16(param string) (uint16, error) {\n\ti, err := strconv.ParseUint(param, 0, 16)\n\tif err != nil {\n\t\treturn 0, err\n\t}\n\treturn uint16(i), nil\n}\n\nfunc StringToInt32(param string) (int32, error) {\n\ti, err := strconv.ParseInt(param, 0, 32)\n\tif err != nil {\n\t\treturn 0, err\n\t}\n\treturn int32(i), nil\n}\n\nfunc StringToUint32(param string) (uint32, error) {\n\ti, err := strconv.ParseUint(param, 0, 32)\n\tif err != nil {\n\t\treturn 0, err\n\t}\n\treturn uint32(i), nil\n}\n\nfunc StringToInt64(param string) (int64, error) {\n\ti, err := strconv.ParseInt(param, 0, 64)\n\tif err != nil {\n\t\treturn 0, err\n\t}\n\treturn i, nil\n}\n\nfunc StringToUint64(param string) (uint64, error) {\n\ti, err := strconv.ParseUint(param, 0, 64)\n\tif err != nil {\n\t\treturn 0, err\n\t}\n\treturn i, nil\n}\n\nfunc StringsToTimeStamps(params []string) ([]time.Time, error) {\n\tl := make([]time.Time, len(params))\n\tfor i, str := range params {\n\t\tf, err := StringToTimestamp(str)\n\t\tif err != nil {\n\t\t\treturn l, err\n\t\t}\n\t\tl[i] = f\n\t}\n\treturn l, nil\n}\n\nfunc StringsToBools(params []string) ([]bool, error) {\n\tl := make([]bool, len(params))\n\tfor i, str := range params {\n\t\tf, err := StringToBool(str)\n\t\tif err != nil {\n\t\t\treturn l, err\n\t\t}\n\t\tl[i] = f\n\t}\n\treturn l, nil\n}\n\nfunc StringsToBytes(params []string) ([][]byte, error) {\n\tl := make([][]byte, len(params))\n\tfor i, str := range params {\n\t\tl[i] = []byte(str)\n\t}\n\treturn l, nil\n}\n\nfunc StringsToFloat32s(params []string) ([]float32, error) {\n\tl := make([]float32, len(params))\n\tfor i, str := range params {\n\t\tf, err := StringToFloat32(str)\n\t\tif err != nil {\n\t\t\treturn l, err\n\t\t}\n\t\tl[i] = f\n\t}\n\treturn l, nil\n}\n\nfunc StringsToFloat64s(params []string) ([]float64, error) {\n\tl := make([]float64, len(params))\n\tfor i, str := range params {\n\t\tf, err := StringToFloat64(str)\n\t\tif err != nil {\n\t\t\treturn l, err\n\t\t}\n\t\tl[i] = f\n\t}\n\treturn l, nil\n}\n\nfunc StringsToInt8s(params []string) ([]int8, error) {\n\tl := make([]int8, len(params))\n\tfor i, str := range params {\n\t\tf, err := StringToInt8(str)\n\t\tif err != nil {\n\t\t\treturn l, err\n\t\t}\n\t\tl[i] = f\n\t}\n\treturn l, nil\n}\n\nfunc StringsToUint8s(params []string) ([]uint8, error) {\n\tl := make([]uint8, len(params))\n\tfor i, str := range params {\n\t\tf, err := StringToUint8(str)\n\t\tif err != nil {\n\t\t\treturn l, err\n\t\t}\n\t\tl[i] = f\n\t}\n\treturn l, nil\n}\n\nfunc StringsToInt16s(params []string) ([]int16, error) {\n\tl := make([]int16, len(params))\n\tfor i, str := range params {\n\t\tf, err := StringToInt16(str)\n\t\tif err != nil {\n\t\t\treturn l, err\n\t\t}\n\t\tl[i] = f\n\t}\n\treturn l, nil\n}\n\nfunc StringsToUint16s(params []string) ([]uint16, error) {\n\tl := make([]uint16, len(params))\n\tfor i, str := range params {\n\t\tf, err := StringToUint16(str)\n\t\tif err != nil {\n\t\t\treturn l, err\n\t\t}\n\t\tl[i] = f\n\t}\n\treturn l, nil\n}\n\nfunc StringsToInt32s(params []string) ([]int32, error) {\n\tl := make([]int32, len(params))\n\tfor i, str := range params {\n\t\tf, err := StringToInt32(str)\n\t\tif err != nil {\n\t\t\treturn l, err\n\t\t}\n\t\tl[i] = f\n\t}\n\treturn l, nil\n}\n\nfunc StringsToUint32s(params []string) ([]uint32, error) {\n\tl := make([]uint32, len(params))\n\tfor i, str := range params {\n\t\tf, err := StringToUint32(str)\n\t\tif err != nil {\n\t\t\treturn l, err\n\t\t}\n\t\tl[i] = f\n\t}\n\treturn l, nil\n}\n\nfunc StringsToInt64s(params []string) ([]int64, error) {\n\tl := make([]int64, len(params))\n\tfor i, str := range params {\n\t\tf, err := StringToInt64(str)\n\t\tif err != nil {\n\t\t\treturn l, err\n\t\t}\n\t\tl[i] = f\n\t}\n\treturn l, nil\n}\n\nfunc StringsToUint64s(params []string) ([]uint64, error) {\n\tl := make([]uint64, len(params))\n\tfor i, str := range params {\n\t\tf, err := StringToUint64(str)\n\t\tif err != nil {\n\t\t\treturn l, err\n\t\t}\n\t\tl[i] = f\n\t}\n\treturn l, nil\n}\n";
//# sourceMappingURL=index.d.ts.map