---
title: Why useMemo instead of useState + useEffect?
date: '2020-03-29'
layout: post
draft: false
tags:
  - React
---


I frequently see useState and useEffect being used together where only useMemo would be enough to handle the same task, and as a bonus it is even faster!


Checkout this example:


```js
function CoolComponent(props) {
    const [items, setItems] = useState();

    useEffect(() => {
        setItems(props.rawItems.map(parseItem));
    }, [props.rawItems]);

    // rest of component...
}

```


I see this pattern being used many times, where the component gets some data from the props and has to manipulate it somehow to a desired format.


When you have an app with hundreds/thousands components or an expensive child component, then every render counts. Unnecessary re-renders should be avoided in order to have a good user experience in your app.


Can you see the problem with useState + useEffect?


It will make your component always re-render twice every time the `props.rawItems` change. This is what happens:


### First render: 

new rawItems are passed in the props.

component renders with items being undefined.

After render is complete react will run the useEffect.

The code inside useEffect will call setItems to update the state causing an extra re-render.

### Second render:

Component renders using the new items from state.


## How would it be with `useMemo`?


```js
function CoolComponent(props) {
    const items = useMemo(() =>
        props.rawItems.map(parseItem);
    , [props.rawItems]);

    // rest of component...
}

```


### First render: 

new rawItems are passed in the props.

useMemo runs and returns the parsed items.

component renders with the correct items.


With this simple technique we avoid an extra unnecessary rerender, we declare less variables and functions, the code is smaller and simpler.


Did you like it? Hold on there is more!


Do you know that if you don't use useMemo it will be even faster?


```js
function CoolComponent(props) {
    const items = props.rawItems.map(parseItem);

    // rest of component...
}

```

Yeah! You should avoid using useMemo, because useMemo is a bit expensive and it should be used only if it brings a real benefit, don't just use useMemo all the time, think about it.


## When use memo can be avoided:

When the type of your variable is a string, boolean, number, or anything else that has a constant instance in memory like those primitive types.

When the code inside useMemo is fast and getting a new instance of an object or array is not a problem, you don't pass it to child components or they are super fast.


## When useMemo should definitely be used?

When keeping the same instance of an array or object is important because you pass it to expensive child components.



## But you may ask: when should we use useState + useEffect?

When the code to parse the data is very expensive that would block the rendering process, then it is better to let react finish the rendering process and run the useEffect later.

When a promise or callback is needed to get the data.

When the state can also be set from somewhere else in the component, then there is no way to use useMemo since it doesn't export a set function like useState.



# Recap


When possible don't use useState, useEffect and useMemo. Every hook will add some costs to the rendering process.


They can be avoided when the code is fast or primitive types like numbers, strings or booleans are used.


Prefer to use useMemo instead of useState + useEffect when you need to keep the same instance of an object or array.


Use useState + useEffect when the code is expensive or you need to use promises or callbacks.


I hope this post helped you understand how useState, useEffect and useMemo work.


To improve the performance of your app it is crucial to have a deep understanding of every render, and why they were triggered.
