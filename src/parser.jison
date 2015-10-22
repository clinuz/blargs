%lex

single								[a-zA-Z0-9]{1}
singles								[a-zA-Z0-9]{2,}
ident									[a-zA-Z0-9]+?(?:'-'|[a-zA-Z0-9])*
value									^(?![\-\[])(?:[^\s'"\]]|\](?!\s+|$))+

%{
var DEBUGGING = false;
function log () {
	if (DEBUGGING) {
		var args = Array.prototype.slice.call(arguments);
		args.unshift('>> ');
		console.log.apply(console, args);
	}
}
%}

%%

[=]																				%{ log('='); return '='; %}
[']																				%{ log('SINGLE', yytext); return 'SINGLE'; %}
["]																				%{ log('DOUBLE', yytext); return 'DOUBLE'; %}
[\[]																			%{ log('S_OPEN', yytext); yy.push(); return 'S_OPEN'; %}
[\]]																			%{ log('S_CLOSE', yytext); return 'S_CLOSE'; %}
'-no-'{singles}														%{ yytext = yytext.slice(4); log('MULTINOBOOLS', yytext); return 'MULTINOBOOLS'; %}
'-no-'{single}														%{ yytext = yytext.slice(4); log('NOBOOL', yytext); return 'NOBOOL'; %}
'--no-'{ident}														%{ yytext = yytext.slice(5); log('NOBOOL', yytext); return 'NOBOOL'; %}
'-'{singles}															%{ yytext = yytext.slice(1); log('MULTIBOOLS', yytext); return 'MULTIBOOLS'; %}
'--'{ident}(?='=')												%{ yytext = yytext.slice(2); log('D_ASSIGN', yytext); return 'D_ASSIGN'; %}
'--'{ident}(?!'=')												%{ yytext = yytext.slice(2); log('D_IDENT', yytext); return 'D_IDENT'; %}
'-'{single}(?=\s+['"])										%{ yytext = yytext.slice(1); log('S_ASSIGN', yytext); return 'S_ASSIGN'; %}
'-'{single}(?=\s+[^\-\]])									%{ yytext = yytext.slice(1); log('S_ASSIGN', yytext); return 'S_ASSIGN'; %}
'-'{single}(?!\s+(?:['"]))								%{ yytext = yytext.slice(1); log('S_IDENT', yytext); return 'S_IDENT'; %}
'--'(?=\s+|$)															%{ log('S_NEXT', yytext); return 'S_NEXT'; %}
{value}																		%{ log('VALUE', yytext); return 'VALUE'; %}
\s+																				/* */
<<EOF>>																		return 'EOF';

/lex

%start start

%%

start
	: args EOF
		{ return yy.end(); }
	;

args
	: args arg
	| args MULTIBOOLS
		{ $2.split('').forEach(function (n) { yy.boolean(n, true); }); }
	| args MULTINOBOOLS
		{ $2.split('').forEach(function (n) { yy.boolean(n, false); }); }
	| arg
	| MULTIBOOLS
		{ $1.split('').forEach(function (n) { yy.boolean(n, true); }); }
	| MULTINOBOOLS
		{ $1.split('').forEach(function (n) { yy.boolean(n, false); }); }
	;

arg
	: assignment
	| boolean
	| VALUE
		{ yy.positional($1); }
	| quote
		{ yy.positional($1); }
	| S_NEXT
		{ yy.next(); }
	;

boolean
	: NOBOOL
		{ yy.boolean($1, false); }
	| S_IDENT
		{ yy.boolean($1, true); }
	| D_IDENT
		{ yy.boolean($1, true); }
	;

assignment
	: D_ASSIGN '=' VALUE
		{ yy.assign($1, $3); }
	| D_ASSIGN '=' quote
		{ yy.assign($1, $3); }
	| D_ASSIGN '=' subargs
		{ yy.assign($1, $3); }
	| S_ASSIGN quote
		{ yy.assign($1, $2); }
	| S_ASSIGN VALUE
		{ yy.assign($1, $2); }
	| S_ASSIGN subargs
		{ yy.assign($1, $2); }
	| S_IDENT '=' VALUE
		{ /* error recovery */ yy.assign($1, $3); }
	;

quote
	: DOUBLE s_values DOUBLE
		{ $$ = $2; }
	| SINGLE d_values SINGLE
		{ $$ = $2; }
	| DOUBLE s_values error
		{ $$ = $2; }
	| SINGLE d_values error
		{ $$ = $2; }
	| DOUBLE error
		{ /* will be dropped */ $$ = undefined; }
	| SINGLE error
		{ /* will be dropped */ $$ = undefined; }
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
		{ $$ = yy.pop(); }
	| S_OPEN args error
		{ $$ = yy.pop(); }
	;