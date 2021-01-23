@builtin "number.ne"
@builtin "whitespace.ne"

main -> expression {% id %}

fcn -> "{" method ":" _ (expression):+ _ "}" {%
    function(data) {
      return {
        operation: data[1],
        children: data[4],
        value: "",  
      }
    }
  %}

method -> "daily" {% id %} | "max" {% id %} | "since" {% id %} | "attr" {% id %}

binop ->
    expression " + " expression {% ([f, operation, s]) => ({operation, children: [f, s], value: ""}) %}
  | expression " - " expression {% ([f, operation, s]) => ({operation, children: [f, s], value: ""}) %}
  | expression " * " expression {% ([f, operation, s]) => ({operation, children: [f, s], value: ""}) %}
  | expression " / " expression {% ([f, operation, s]) => ({operation, children: [f, s], value: ""}) %}

expression -> number {% id %} | tag {% id %} | binop {% id %} | fcn {% id %}

number -> decimal {% ([value]) => ({operation: "value", children: [], value}) %}

tag -> 
    "[[" [a-zA-Z0-9 ]:+ "]]" {% ([_, value]) => ({operation: "value", children: [], value}) %}
  | "#[[" [a-zA-Z0-9 ]:+ "]]" {% ([_, value]) => ({operation: "value", children: [], value}) %}
  | "#" [a-zA-Z0-9]:+ {% ([_, value]) => ({operation: "value", children: [], value}) %}
