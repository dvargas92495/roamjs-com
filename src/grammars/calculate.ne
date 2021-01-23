@builtin "number.ne"
@builtin "whitespace.ne"

main -> expression {% id %}

expression -> number {% id %} | tag {% id %} | binop {% id %} | fcn {% id %}

fcn -> "{" method ":" _ (expression):+ _ "}" {%
    function(data) {
      return {
        operation: data[1],
        children: data[4],
        value: "",  
      }
    }
  %}

method -> ("daily" | "max" | "since" | "attr") {% id %}

binop -> sum {% id %}
sum ->  sum _ ("+"|"-") _  product {% ([f, _, operation, __, s]) => ({operation, children: [f, s], value: ""}) %} | product {% id %}
product -> product _ ("*"|"/") _ numberLike {% ([f, _, operation, __, s]) => ({operation, children: [f, s], value: ""}) %} | numberLike {% id %}
numberLike -> ( number | fcn ) {% id %}
number -> decimal {% ([value]) => ({operation: "value", children: [], value}) %}

tag -> 
    "[[" [a-zA-Z0-9 ]:+ "]]" {% ([_, value]) => ({operation: "value", children: [], value: value.join("")}) %}
  | "#[[" [a-zA-Z0-9 ]:+ "]]" {% ([_, value]) => ({operation: "value", children: [], value: value.join("")}) %}
  | "#" [a-zA-Z0-9]:+ {% ([_, value]) => ({operation: "value", children: [], value: value.join("")}) %}
