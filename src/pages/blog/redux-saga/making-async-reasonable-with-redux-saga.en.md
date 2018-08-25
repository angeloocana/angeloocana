---
title: Making async reasonable with redux saga
date: '2018-08-24'
layout: post
draft: false
tags:
  - JavaScript
  - ES6
---

Redux-saga + the Yield keyword are the most powerful tool I've ever seen in the JavaScript world to manage side-effects (API calls, DBs, log, ...)

I created this content for a [presentation](https://angeloocana.com/redux-saga-presentation.html) at Kinaxis, where I'm working right now.

I hope you can learn new things and improve the reasonability of your code. =D

# Agenda

- Why redux-saga?

- What is redux-saga?

- What is Yield?

- Callbacks x Promises x Yield

- Effects

- Channels


# Why redux-saga?

- Makes your code more reasonable

- Easy to test (no mocks)

- No circular dependencies

- Ideal for common real-world applications

- Works on both client and server

- Large and growing contributing user base


# What is redux-saga?

- Redux middleware

- Manages side effects (API, DB, logs, etc.)

- Listen for actions, dispatches other actions, (using effects)

- Maintains continuously running process called sagas

- Uses Yield keyword


# What is Yield?

- Special keyword that can delay the execution of subsequent code

- Only works inside generator functions

- Works with promises and condenses code surrounding them


# Callbacks x Promises x Yield

## Async example with callbacks

```js
    api.call(URL, function callback(data){
        // code execution resumes here
    });

    // code outside callback runs before callback resolution
```

Code tends to drift to the right with more nested callbacks. (Callback hell)

```js
    api.call(URL_A, function callback(dataA){
        api.call(URL_B, function callback(dataB){
            api.call(URL_C, function callback(dataC){
                // ...
            });
        });
    });

    // code outside callbacks runs before callbacks resolutions
```

## Async example with promises

```js

    api.call(URL)
    .then(data => {
        // code execution resumes here
    });
    
    // code after ".then()" runs before promise resolution
```

Code tends to grow vertically with additional "then" calls

```js

    api.call(URL_A)
    .then(dataA => {
        return api.call(URL_B);
    })
    .then(dataB => {
        return api.call(URL_C);
    })
    .then(dataC => {
        // ...
    });

    // code after ".then()" runs before all promises resolutions
```

## Async example with yield

```js
    const data = yield api.call(URL);

    // Execution resumes here. No code can run before promise resolution.
```
Code meant to be executed after call resolves can be placed on next line, as with synchronous code

No additional scope required

Code is always compact

```js
    const dataA = yield api.call(URL_A);
    const dataB = yield api.call(URL_B);
    const dataC = yield api.call(URL_C);

    // Execution resumes here. No code can run before all promises resolutions.
```

# Yield

## Advantages

- Significantly fewer lines of code

- Significantly less indentation (avoids "callback hell")

- Easiest to read quickly, reason about

- Easier to debug

- Execution stops on unhandled error


## Disadvantages

- Only works inside Generator Functions

- Requires additional plugins


# What is a Generator Function?

- Special Javascript function denoted by *

- Calling function returns a generator

- Actual code is executed by calling "next" method

- Can "yield" multiple values

```js
    function* generateId() {
        var id = 0;
        
        while(true) {
            id = id + 1;
            yield id;
        }
    }

    const gen = generateId();
    gen.next().value; // 1
    gen.next().value; // 2
    gen.next().value; // 3
```


# Continuously running process example

Sagas can run forever

```js
import { delay } from "redux-saga";

function* logEachSecond() {
    while(true){
        yield delay(1000);
        console.log("Saga loop");
    }
}
```


# Effects

functions that return a plain JavaScript object and do not perform any execution.

- The execution is performed by the middleware during the Iteration process.

- The middleware examines each Effect description and performs the appropriate action.


## select, call and put

select: gets a value from the store

call: calls any function, most used for side-effects

put: dispatches one action to the store

```js
import { select, call, put } from "redux-saga/effects";
import actions from "../actions";
import api from "../api";

function getWorksheet(worksheetId) {
    const filters = yield select(state => state.filters[worksheetId]);

    const data = yield call(api.getWorksheet, { worksheetId, filters });

    yield put(actions.setWorksheet(data));
}
```

## How to test?

```js
function* signIn(user) {
    const result = yield call(api.signIn, user);

    if(result.ok) {
        yield put(actions.setAuthUser(result));
    } else {
        yield put(actions.alertError(result));
    }
}
```
```js
beforeEach(() => {
    gen = signIn();

    expect(gen.next(user).value)
        .toEqual(call(api.signIn, user));
});

test("signIn ok", () => {
    expect(gen.next(resultOk).value)
        .toEqual(put(actions.setAuthUser(resultOK)));
});

test("signIn error", () => {
    expect(gen.next(resultError).value)
        .toEqual(put(actions.alertError(resultError)));
});
```

### Handle errors with Try Catch

```js
import { select, call, put } from "redux-saga/effects";
import actions from "../actions";
import api from "../api";

function getWorksheet(worksheetId) {
    try{
        const filters = yield select(state => state.filters[worksheetId]);

        const data = yield call(api.getWorksheet, { worksheetId, filters });

        yield put(actions.setWorksheet(data));
    } catch (error) {
        yield put(actions.logError(error));
    }
}
```

## takeEvery

starts a saga for all dispatched actions.

```js
import { takeEvery } from "redux-saga/effects";

function* handleActionA(action) {
    // ...
}

function* watchActions() {
    yield takeEvery('ACTION_A', handleActionA);
}
```


## takeLatest

cancels the current Saga if it is running and starts the latest dispatched action.

```js
import { takeLatest } from "redux-saga/effects";

function* handleActionA(action) {
    // ...
}

function* watchActions() {
    yield takeLatest('ACTION_A', handleActionA);
}
```


## race

Sometimes we start multiple tasks in parallel but we don't want to wait for all of them, we just need to get the winner.

```js
import { race, take, put } from 'redux-saga/effects'
import { delay } from 'redux-saga'

function* fetchPostsWithTimeout() {
  const {posts, timeout} = yield race({
    posts: call(fetchApi, '/posts'),
    timeout: call(delay, 1000)
  })

  if (posts)
    put({type: 'POSTS_RECEIVED', posts})
  else
    put({type: 'TIMEOUT_ERROR'})
}
```

## all

waits all calls to return.

```js
import api from '../api';
import { all, call } from `redux-saga/effects`;

function* mySaga() {
  const [customers, products] = yield all([
    call(api.fetchCustomers),
    call(api.fetchProducts)
  ]);
}
```


## throttle

ensures that the Saga will take at most one action during each period of specified time. 

```js
function* handleInput(input) {
    // ...
}

function* watchInput() {
    yield throttle(500, 'INPUT_CHANGED', handleInput);
}
```


## take

waits until it gets the desired action.

```js
import { put, take, call } from "redux-saga/effects";
import actions from "../actions";
import api from "../api";

function* removeUser(user) {
    yield put(actions.confirmRemoveUser(user));

    yield take("CONFIRM_OK");

    yield call(api.removeUser, user);
}
```

```js
import { actionChannel, take, call } from "redux-saga/effects";
import api from "../api";

function* queueActions() {
    while(true) {
        const action = yield take("LOG_ERROR");
        yield call(api.log, action);
        // ...
    }
}
```


## actionChannel

creates a queue of actions, you don't lose any action and you can process one by one.

```js
import { actionChannel, take, call } from "redux-saga/effects";
import api from "../api";

function* queueActions() {
    const channel = yield actionChannel("LOG_ERROR");

    while(true) {
        const action = yield take(channel);
        yield call(api.log, action);
        // ...
    }
}
```


# The end

## Thank you!!!

### References + Learn more

- Redux Saga https://app.pluralsight.com/library/courses/redux-saga

- Advanced Redux https://app.pluralsight.com/library/courses/advanced-redux

- Async React with Redux Saga https://egghead.io/courses/async-react-with-redux-saga

- Redux Saga docs https://redux-saga.js.org/
