@builtin "number.ne"
@builtin "whitespace.ne"

main -> expression {% id %}

expression -> tag {% id %} | binop {% id %}

fcn -> "{" method ":" _ (expression _ {% id %}):+ "}" {%
    function(data) {
      return {
        operation: data[1],
        children: data[4],
        value: "",  
      }
    }
  %}

method -> "daily" {% id %} | "max" {% id %} | "since" {% id %} | "attr" {% id %}

binop -> sum {% id %}
sum ->  sum _ ("+" {% id %}|"-" {% id %}) _  product {% ([f, _, operation, __, s]) => ({operation, children: [f, s], value: ""}) %} | product {% id %}
product -> product _ ("*" {% id %}|"/" {% id %}) _ numberLike {% ([f, _, operation, __, s]) => ({operation, children: [f, s], value: ""}) %} | numberLike {% id %}
numberLike -> number {% id %} | fcn {% id %}
number -> decimal {% ([value]) => ({operation: "value", children: [], value}) %}

tag -> 
    "[[" [a-zA-Z0-9 ]:+ "]]" {% ([_, value]) => ({operation: "value", children: [], value: value.join("")}) %}
  | "#[[" [a-zA-Z0-9 ]:+ "]]" {% ([_, value]) => ({operation: "value", children: [], value: value.join("")}) %}
  | "#" [a-zA-Z0-9]:+ {% ([_, value]) => ({operation: "value", children: [], value: value.join("")}) %}
