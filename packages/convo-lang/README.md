# convo-lang
A conversational prompting and templating language. Convo aims to simplify complex prompts and
provide a programming language that can natively communicate LLMs function calling.



## Language structure
Convo scripts consist of a series of messages. A message can either define content to populate a
conversation or a code block that can contain top level statements or a function.

``` convo
> stuff

```


## Language structure

- message
  - role
    - string
    - add
      - string
      - statement
  - code
    - top level
    - function
      - body
      - extern



## Comments
Comments start with either a pound character or 2 forwards slashes. Comments starting with a pound
symbol are captured and available at run time as part of type definitions. Comments starting with
2 forward slashes are non capturing.

