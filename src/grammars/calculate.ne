@builtin "number.ne"

fcn -> "{" method ":" (expression):+ "}" {%
    function(data) {
      return {
        operation: data[0],
        children: data.slice(1),
        value: "",  
      }
    }
  %}

method -> "daily" | "max" | "since" | "attr"

binop ->
    expression " + " expression
  | expression " - " expression
  | expression " * " expression
  | expression " / " expression {%
    function(data) {
      return {
        operation: data[1],
        children: [data[0], data[2]],
        value: "",  
      }
    }
  %}

expression -> number | tag | binop | fcn

number -> decimal {%
    function(data) {
      return {
        operation: "value",
        children: [],
        value: data[0],  
      }
    }
  %}

tag -> 
    "[[" [a-zA-Z0-9]:+ "]]"
  | "#[[" [a-zA-Z0-9]:+ "]]"
  | "#" [a-zA-Z0-9]:+ {%
    function(data) {
      return {
        operation: "value",
        children: [],
        value: data[0],  
      }
    }
  %}
