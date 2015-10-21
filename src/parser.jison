%lex

single								[a-zA-Z0-9]{1}
singles								[a-zA-Z0-9]{2,}
ident									[a-zA-Z0-9]+?(?:'-'|[a-zA-Z0-9])*
value									[^\s'"]+

%%

'-no-'{singles}														%{ yytext = yytext.slice(4); return 'MULTINOBOOLS'; %}
'-no-'{single}														%{ yytext = yytext.slice(4); return 'NOBOOL'; %}
'--no-'{ident}														%{ yytext = yytext.slice(5); return 'NOBOOL'; %}
'-'{singles}															%{ yytext = yytext.slice(1); return 'MULTIBOOLS'; %}
'--'{ident}(?='=')												%{ yytext = yytext.slice(2); return 'D_ASSIGN'; %}
'--'{ident}(?!'=')												%{ yytext = yytext.slice(2); return 'D_IDENT'; %}
'-'{single}(?=\s+['"])										%{ yytext = yytext.slice(1); return 'S_ASSIGN'; %}
'-'{single}(?=\s+[^\-])										%{ yytext = yytext.slice(1); return 'S_ASSIGN'; %}
'-'{single}(?!\s+(?:['"]|[^\-]))					%{ yytext = yytext.slice(1); return 'S_IDENT'; %}
[=]																				%{ return '='; %}
[']																				%{ return 'SINGLE'; %}
["]																				%{ return 'DOUBLE'; %}
[\[]																			%{ return 'S_OPEN'; %}
[\]]																			%{ return 'S_CLOSE'; %}
{value}																		%{ return 'VALUE'; %}
\s+																				/* */
<<EOF>>																		return 'EOF';

/lex

%start start

%%

start
	: args EOF
		{ return $1; }
	;

args
	: args arg
		{ $1.push($2); $$ = $1; }
	| args MULTIBOOLS
		{ $$ = $1.concat($2.split('').map(function (n) { return { name: n, value: true }; })); }
	| args MULTINOBOOLS
		{ $$ = $1.concat($2.split('').map(function (n) { return { name: n, value: false }; })); }
	| arg
		{ $$ = [$1]; }
	;

arg
	: assignment
	| boolean
	| VALUE
		{ $$ = { name: $1 }; }
	| quote
		{ $$ = { name: $1 }; }
	;

boolean
	: NOBOOL
		{ $$ = { name: $1, value: false }; }
	| S_IDENT
		{ $$ = { name: $1, value: true }; }
	| D_IDENT
		{ $$ = { name: $1, value: true }; }
	;

assignment
	: D_ASSIGN '=' VALUE
		{ $$ = { name: $1, value: $3 }; }
	| D_ASSIGN '=' quote
		{ $$ = { name: $1, value: $3 }; }
	| D_ASSIGN '=' subargs
		{ $$ = { name: $1, value: $3 }; }
	| S_ASSIGN quote
		{ $$ = { name: $1, value: $2 }; }
	| S_ASSIGN VALUE
		{ $$ = { name: $1, value: $2 }; }
	| S_ASSIGN subargs
		{ $$ = { name: $1, value: $2 }; }
	;

quote
	: DOUBLE s_values DOUBLE
		{ $$ = $2; }
	| SINGLE d_values SINGLE
		{ $$ = $2; }
	;

s_values
	: s_values VALUE
		{ $$ = $1 + ' ' + $2; }
	| s_values SINGLE
		{ $$ = $1 + ' ' + $2; }
	| SINGLE
		{ $$ = $1; }
	| VALUE
		{ $$ = $1; }
	;

d_values
	: d_values VALUE
		{ $$ = $1 + ' ' + $2; }
	| d_values DOUBLE
		{ $$ = $1 + ' ' + $2; }
	| DOUBLE
		{ $$ = $1; }
	| VALUE
		{ $$ = $1; }
	;

subargs
	: S_OPEN args S_CLOSE
		{ $$ = $2; }
	;