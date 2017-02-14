(function (window, undefined) {
    /**
     * Create a new instance of the test framework.
     * 
     * @param {any} postmanWindow the current postman window, should be `this` in you tests scripts.
     * @param {any} postmanTestsArray the postman `tests` object.
     * @returns the test framework, connected to the current postman window.
     */
    var postmanTestFramework = function (postmanWindow, postmanTestsArray) {
        // Private variables
        var tests = postmanTestsArray;
        var postman = postmanWindow.postman;
        var responseCode = postmanWindow.responseCode;
        var responseBody = postmanWindow.responseBody;
        var requestData = request.data;

        // "const"
        var constant = {
            dataShouldBeValidObject: 'Response data should be a valid object',
            dataShouldBeValidArray: 'Response data should be a valid array',
            arrayShouldNotBeEmpty: 'Response data array should not be empty',
            responseTimeShouldBe: "Response time should be less than {0}ms",
            statusCodeShouldBe: "Response status code should be {0}",
            shouldNotBeEmpty: "Response should not be empty",
            shouldBeEmpty: "Response should be empty",
            shouldBeJson: "Response should be JSON"
        };

        // Public API
        var framework = {
            constant: constant,

            utils: {
                defaults: {
                    bool: function (b, defaultValue) {
                        return _.isBoolean(b) ? b : defaultValue;
                    }
                },

                stringFormat: stringFormat,
                isJson: isJson
            },

            auth: {
                setAccessToken: function (globalVarName) {
                    postman.setGlobalVariable(globalVarName, framework.response.jsonData.access_token);
                }
            },

            request: {
                // Return `true` if the response has a body, otherwise false.
                hasBody: function () {
                    //return responseBody === undefined || responseBody === null || responseBody === '';
                    return !_.isEmpty(requestData);
                }
            },
            response: {
                // Return `true` if the response has a body, otherwise false.
                hasBody: function () {
                    //return responseBody === undefined || responseBody === null || responseBody === '';
                    return !_.isEmpty(responseBody);
                },

                is: {
                    an: {
                        // Failing validation tests
                        invalid: {
                            object: function () {
                                tests[constant.dataShouldBeValidObject] = false;
                            },

                            array: function (arrayCanBeEmpty) {
                                arrayCanBeEmpty = framework.utils.defaults.bool(arrayCanBeEmpty, false);

                                tests[constant.dataShouldBeValidArray] = false;
                                if (!arrayCanBeEmpty) {
                                    tests[constant.arrayShouldNotBeEmpty] = false;
                                }
                            }
                        }
                    }
                },

                should: {
                    not: {
                        be: {
                            empty: function () {
                                var result = framework.response.hasBody();
                                tests[constant.shouldNotBeEmpty] = result;
                                return result;
                            }
                        }
                    },
                    be: {
                        empty: function () {
                            var result = !framework.response.hasBody();
                            tests[constant.shouldBeEmpty] = result;
                            return result;
                        },
                        fast: function () {
                            var expectedResponseTime = postman.getEnvironmentVariable("ExpectedFastResponseTime");
                            var text = stringFormat(constant.responseTimeShouldBe, expectedResponseTime);
                            var result = responseTime < expectedResponseTime;
                            tests[text] = result;
                            return result;
                        },
                        json: function () {
                            var result = framework.response.jsonData !== null;
                            tests[constant.shouldBeJson] = result;
                            return result;
                        },
                        statusCode: function (expectedStatusCode) {
                            var text = stringFormat(constant.statusCodeShouldBe, expectedStatusCode);
                            result = responseCode.code === expectedStatusCode;
                            tests[text] = result;
                            return result;
                        },
                        ok: function () {
                            return this.statusCode(200);
                        },
                        notFound: function () {
                            return this.statusCode(404);
                        },
                        serverError: function () {
                            return this.statusCode(500);
                        },
                        badRequest: function () {
                            return this.statusCode(400);
                        },
                        created: function () {
                            return this.statusCode(201);
                        },
                        a: {
                            valid: {
                                // Validate data based on the swagger 2.0 single object schema
                                object: function (baseUrlEnvVarName, schema$ref) {
                                    var schema = {
                                        "$ref": schema$ref
                                    };
                                    return this.schema(baseUrlEnvVarName, schema, constant.dataShouldBeValidObject);
                                },

                                // Validate data based on the swagger 2.0 array schema
                                array: function (baseUrlEnvVarName, schema$ref, arrayCanBeEmpty) {
                                    arrayCanBeEmpty = framework.utils.defaults.bool(arrayCanBeEmpty, false);

                                    var schema = {
                                        "type": "array",
                                        "items": {
                                            "$ref": schema$ref
                                        }
                                    };

                                    var isValid = this.schema(baseUrlEnvVarName, schema, constant.dataShouldBeValidArray);
                                    if (!arrayCanBeEmpty) {
                                        if (isValid) {
                                            isValid = framework.response.jsonData.length > 0;
                                            tests[constant.arrayShouldNotBeEmpty] = isValid;
                                        } else {
                                            framework.response.is.an.invalid.array();
                                        }
                                    }
                                    return isValid;
                                },

                                // Validate data based on the swagger 2.0 schema
                                schema: function (baseUrlEnvVarName, schema, text) {
                                    var isDataValid = false;

                                    if (framework.response.hasBody()) {
                                        var baseUrl = postman.getEnvironmentVariable(baseUrlEnvVarName);
                                        var url = baseUrl + '/swagger/v1/swagger.json';
                                        tv4.addSchema(url);
                                        isDataValid = tv4.validate(framework.response.jsonData, schema);
                                    }

                                    tests[text] = isDataValid;
                                    return isDataValid;
                                },

                                dynamicInternalServerErrorObject: function (baseUrlEnvVarName) {
                                    return this.object(baseUrlEnvVarName, '#/definitions/IDynamicInternalServerErrorObject')
                                },

                                validationException: function (baseUrlEnvVarName) {
                                    var isValidDynamicInternalServerErrorObject = this.dynamicInternalServerErrorObject(baseUrlEnvVarName);
                                    var isValidTypeName = framework.response.jsonData.typeName === "ValidationException";
                                    var isValidMessage = framework.response.jsonData.message === "An error occurred during validation.";

                                    tests["typeName should be `ValidationException`."] = isValidTypeName;
                                    tests["message should be `An error occurred during validation.`."] = isValidMessage;

                                    return isValidDynamicInternalServerErrorObject && isValidTypeName && isValidMessage;
                                }
                            }
                        }
                    }
                }
            }
        }

        // Set parsed json response
        framework.response.jsonData = framework.response.hasBody() ? JSON.parse(responseBody) : null;

        // Set parsed json request
        framework.request.jsonData = framework.request.hasBody() && framework.utils.isJson(requestData) ? JSON.parse(requestData) : null;

        // Return the public API
        return framework;
    };

    // Utility
    function stringFormat(stringToFormat) {
        var output = stringToFormat;
        var currentIndex = 0;
        for (var i = 1; i < arguments.length; i++ , currentIndex++) {
            output = output.replace('{' + currentIndex + '}', arguments[i]);
        }
        return output;
    }

    // Fast JSON check. 
    // This should work in the present context, but this does not validate if the JSON string is well formed.
    function isJson(text) {
        if (_.isString(text)) {
            var firstChar = text.substring(0, 1);
            return firstChar === '{' || firstChar === '[';
        } else {
            return false;
        }
    }


    function guid() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    // Attach the test framework to "window"
    window.ForEvolve = {
        Tests: {
            Engine: postmanTestFramework,
            Utils: {
                createGuid: guid
            }
        }
    };
}(window));

