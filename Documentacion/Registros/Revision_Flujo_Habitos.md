# Revision del flujo de habitos

Este archivo registra los problemas detectados durante la revision del
flujo de habitos. La numeracion respeta el inventario de modales usado
para la revision.

## Panel 1 - Panel de habitos

1.1. [x] En la cabecera del panel de habitos, el icono generico `H`
deberia reemplazarse por el simbolo visual propio de habitos para
mantener consistencia con el resto de la interfaz.

1.2. [x] En el filtro de dia, la opcion `Cada dia` resulta ambigua. La
interfaz deberia aclarar si significa habitos programados todos los
dias, habitos disponibles cualquier dia, o ausencia de filtro.

1.3. [x] El estado vacio `No hay habitos para estos filtros` deberia ocupar
todo el ancho disponible del panel. Actualmente queda restringido a una
columna o bloque parcial, lo que genera una composicion visual
desbalanceada.

## Panel 2 - Nuevo / editar habito

2.1. [x] Los campos `Modo`, `Periodo`, `Meta` y el campo siguiente de la
configuracion de meta deberian quedar alineados en una misma fila para
reducir altura y mejorar lectura del bloque.

2.2. [x] Cuando el modo de meta sea `Check`, el campo `Meta` deberia
ocultarse, porque no aporta informacion accionable en ese modo.

2.3. [x] El campo `Regla` deberia ubicarse antes de `Meta`, es decir, a la
izquierda dentro de la misma linea de configuracion.

2.4. [x] Cuando el modo sea `Tiempo`, la configuracion deberia mostrar junto
a `Meta` un desplegable de unidad con opciones `Minutos` y `Horas`, de
modo que la meta se lea como una cantidad temporal explicita.

2.5. [x] Los labels principales del formulario deberian ofrecer ayuda por
hover. En particular, `Modo` deberia explicar que significa `Check`,
`Tiempo` y `Cantidad`, y el mismo criterio deberia aplicarse a los
demas campos cuya funcion no sea evidente.

2.6. [x] Cuando el modo sea `Cantidad`, el campo de unidad deberia mostrarse
como texto personalizado en lugar de unidad temporal. En ese caso, los
cinco campos de configuracion de meta deberian entrar en una misma fila,
ajustando anchos y tamanos tipograficos sin romper el recuadro.

2.7. [x] El campo `Programacion` deberia eliminarse del formulario.

2.8. [x] El label `Horas puntuales` deberia simplificarse a `Horas`.

2.9. [x] La configuracion de horas deberia ser condicional: con `Rango
especifico`, mostrar hora inicial y hora final en la misma linea; con
`Personalizado`, mostrar un campo de texto para ingresar varias horas
separadas por comas; con `Puntual`, mostrar un desplegable con todas las
horas del dia para elegir una sola.

2.10. [x] La configuracion de dias deberia seguir el mismo criterio: con
`Rango especifico`, mostrar dia inicial y dia final; con
`Personalizado`, mostrar los siete dias seleccionables; no deberia haber
una opcion adicional de dias puntuales separada de esas dos variantes.

2.11. [x] Tanto en dias como en horas, el estado por defecto deberia ser
`Todos` y no deberia mostrar campos adicionales. Los campos secundarios
deben aparecer solo cuando la opcion seleccionada los necesita.

2.12. [x] El selector de emoji del habito tiene una presentacion visual
demasiado pesada y poco pulida. Deberia adoptar el patron usado en
otros modales, donde el emoji se muestra como un boton circular compacto
y el selector se abre al hacer click.

2.13. [x] La fila inicial del formulario deberia integrar en una misma linea
el emoji, el nombre, el color, el tipo y el checkbox de activo. Esa
agrupacion permitiria leer de una vez la identidad principal del habito.

2.14. [x] Los campos `Tipo`, `Activo` y el resto de opciones conceptuales
del formulario deberian tener ayuda contextual por hover. Hoy no queda
claro que significa cada control ni que impacto tiene sobre el habito.

2.15. [x] Las reglas actuales de meta (`Al menos`, `Exactamente` y `Como
maximo`) parecen insuficientes para cubrir todos los casos de uso. Antes
de implementar UI nueva, conviene revisar si falta una regla adicional o
si alguna regla existente esta mezclando comportamientos distintos.

2.16. [x] El tipo de habito `Evitar` no deberia exponer automaticamente la
misma configuracion que un habito positivo. Ese tipo necesita una
definicion funcional especifica, porque sus reglas, metas y estados
probablemente deberian comportarse distinto.
