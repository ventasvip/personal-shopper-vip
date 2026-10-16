export const TERMS_TITLE = 'TÉRMINOS Y CONDICIONES DEL SERVICIO – PERSONAL SHOPPER VIP';

export const TERMS_INTRODUCTION = 'Bienvenido a Personal Shopper VIP. Al utilizar nuestros servicios de compra por encargo, gestión logística, transporte internacional y nacional, el usuario (en adelante, el "Cliente") declara que ha leído, entendido y aceptado de manera libre y expresa los siguientes términos y condiciones.';

export type TermsBlock =
  | { type: 'paragraph'; text: string; emphasis?: boolean }
  | { type: 'notice'; title: string; text: string }
  | { type: 'list'; items: readonly { label?: string; text: string }[] };

export interface TermsSection {
  id: string;
  title: string;
  highlighted?: boolean;
  blocks: readonly TermsBlock[];
}

// Texto facilitado por el titular del servicio. La publicación no registra aceptación
// ni modifica la fórmula de cotización o las condiciones de pago de la aplicación.
export const TERMS_SECTIONS: readonly TermsSection[] = [
  {
    id: 'naturaleza-del-servicio',
    title: '1. Naturaleza del Servicio (Aviso Importante)',
    blocks: [
      {
        type: 'paragraph',
        emphasis: true,
        text: 'Personal Shopper VIP y su representante legal, John Reyes Calderon, NO SOMOS UNA TIENDA VIRTUAL NI UN ESTABLECIMIENTO DE COMERCIO VENDEDOR DE EQUIPOS O TECNOLOGÍA.',
      },
      {
        type: 'paragraph',
        text: 'Nuestra empresa actúa exclusivamente como una plataforma de gestión de compras por encargo y un operador logístico. Nuestro único objetivo y compromiso es actuar como intermediarios y facilitadores para comprar en tiendas oficiales y reconocidas en los Estados Unidos a nombre del cliente, ahorrándoles costos adicionales, y asegurarnos de que el producto llegue de manera segura a su domicilio en Colombia mediante la modalidad de viajeros o carga courier autorizada.',
      },
    ],
  },
  {
    id: 'servicio-de-logistica',
    title: '2. Qué Incluye Nuestro Servicio de Logística',
    blocks: [
      { type: 'paragraph', text: 'Nuestros servicios integrales de logística y transporte comprenden:' },
      {
        type: 'list',
        items: [
          { label: 'Gestión de compra en origen:', text: 'Compra directa en tiendas de los Estados Unidos según las especificaciones brindadas por el cliente.' },
          { label: 'Recepción y almacenamiento temporal:', text: 'Recepción de los paquetes en nuestra bodega o centro de recepción en los Estados Unidos.' },
          { label: 'Transporte Internacional:', text: 'Envío de la mercancía desde los Estados Unidos hasta Colombia. Todo paquete viaja asegurado internacionalmente única y exclusivamente contra pérdida total.' },
          { label: 'Trámites aduaneros:', text: 'Gestión legal de importación y nacionalización ante las autoridades competentes en Colombia.' },
          { label: 'Entrega a domicilio a nivel nacional:', text: 'Despacho hasta la puerta de su casa en cualquier ciudad de Colombia a través de las principales empresas transportadoras aliadas (Envia, Inter Rapidísimo, Servientrega, TCC, Coordinadora, entre otras).' },
        ],
      },
    ],
  },
  {
    id: 'tiempos-de-entrega',
    title: '3. Tiempos de Entrega Estimados',
    blocks: [
      { type: 'paragraph', text: 'Los tiempos de tránsito y entrega aproximados son:' },
      {
        type: 'list',
        items: [
          { label: 'Bogotá:', text: '12 días hábiles.' },
          { label: 'Resto del país:', text: '15 días hábiles.' },
        ],
      },
      { type: 'paragraph', text: '(Los tiempos se cuentan a partir de la recepción oficial del paquete en nuestra bodega de Estados Unidos o según las condiciones específicas de disponibilidad de cada tienda).' },
    ],
  },
  {
    id: 'limitacion-de-responsabilidad',
    title: '4. Limitación de Responsabilidad por Daños, Desperfectos y Mal Uso',
    blocks: [
      {
        type: 'list',
        items: [
          { label: 'Artículos nuevos o de fábrica:', text: 'Personal Shopper VIP y su representante John Reyes Calderon NO SOMOS RESPONSABLES por fallas de fábrica, defectos de hardware/software, daños o desperfectos que traiga el artículo desde el fabricante o la tienda de origen en Estados Unidos.' },
          { label: 'Manipulación o mal uso:', text: 'Quedamos totalmente exentos de responsabilidad por daños físicos, golpes, rayones o fallas derivadas del mal uso, manipulación incorrecta, accidentes o negligencia por parte del usuario una vez el producto ha sido entregado a satisfacción.' },
          { label: 'Transporte Nacional y Seguros:', text: 'Todos nuestros paquetes viajan asegurados por su valor comercial desde Bogotá hacia el resto del país. Cualquier daño, avería o pérdida parcial/total ocurrida durante el transporte nacional debe ser gestionada directamente por el cliente ante la empresa transportadora correspondiente (ej. Servientrega, Coordinadora, etc.) y no ante Personal Shopper VIP, eximiendo de toda responsabilidad a nuestra empresa y a su representante legal, John Reyes Calderon.' },
        ],
      },
    ],
  },
  {
    id: 'garantias-y-devoluciones',
    title: '5. Gestión de Garantías y Devoluciones Internacionales',
    blocks: [
      { type: 'paragraph', text: 'Nuestro compromiso como gestores logísticos frente a garantías o devoluciones con la tienda o marca de origen es el siguiente:' },
      {
        type: 'list',
        items: [
          { label: 'Intermediación:', text: 'Gestionamos la solicitud de garantía o devolución directamente con la tienda o fabricante internacional en los Estados Unidos.' },
          { label: 'Tarifa especial:', text: 'Ofrecemos una tarifa preferencial para el reenvío del artículo hacia los Estados Unidos.' },
          { label: 'Logística en Colombia:', text: 'Para iniciar este proceso, el cliente debe hacer llegar obligatoriamente el paquete desde su ciudad de origen hasta nuestras oficinas ubicadas en Madrid, Cundinamarca, costeando dichos fletes locales.' },
          { label: 'Alcance de nuestra responsabilidad:', text: 'Nuestra responsabilidad única y exclusiva en este proceso culmina en el momento en que hacemos la entrega física del artículo a la tienda internacional.' },
        ],
      },
    ],
  },
  {
    id: 'devolucion-de-dinero',
    title: '6. Política de Devolución de Dinero',
    blocks: [
      { type: 'paragraph', text: 'En caso de que el cliente decida no aceptar el artículo en reemplazo ofrecido por parte de la tienda y prefiera la devolución de su dinero:' },
      {
        type: 'list',
        items: [
          { label: 'Responsabilidad única:', text: 'Nuestra empresa Personal Shopper VIP a través de su representante John Reyes Calderon tiene la responsabilidad única y exclusiva de reintegrar al cliente exactamente la cantidad devuelta por la tienda en dólares.' },
          { label: 'Proceso de transferencia:', text: 'Dichos dólares serán recepcionados por nosotros en la cuenta de dólares digitales de ARQ, y desde esta cuenta se hará la transferencia a la cuenta que el cliente elija por medio de transferencia bancaria o uso de llaves Bre-B.' },
          { label: 'Tasa de cambio:', text: 'El cliente recibirá la cantidad correspondiente en Pesos Colombianos NO según la T.R.M. (Tasa Representativa del Mercado del día), sino la tasa y los descuentos aplicados por su respectiva entidad bancaria. Nuestra empresa NO SE HACE RESPONSABLE por la diferencia ocasionada por la fluctuación del dólar o comisiones de recepción de terceros.' },
          { label: 'Aclaración importante:', text: 'El cliente NO DEBERÁ ESPERAR NI RECIBIRÁ la devolución de una cantidad igual a la que pagó inicialmente por el producto, ya que este valor incluía rubros adicionales que ocasiona el servicio de compra internacional, tales como impuestos internacionales, fletes, trámites aduaneros en Colombia y envíos a domicilio.' },
          { label: 'Transparencia:', text: 'Para dar total transparencia a la devolución, Personal Shopper VIP y John Reyes Calderon enviarán al cliente el soporte de la devolución entregado directamente por la tienda.' },
          { label: 'Tributos aduaneros:', text: 'Es importante recordar que NO SOMOS UNA TIENDA, NO VENDEMOS ARTÍCULOS Y NO SOMOS REPRESENTANTES DE NINGUNA TIENDA NI MARCA EN COLOMBIA; por tal motivo, NO PODEMOS ASUMIR LA DEVOLUCIÓN DE DINEROS QUE YA HAYAN SIDO PAGADOS EN TRIBUTOS ADUANEROS.' },
          { label: 'Asunción de riesgo:', text: 'El cliente acepta y reconoce la solicitud de devolución de dinero por parte de la tienda internacional bajo su cuenta y riesgo, y asume los costos y variaciones financieras que esta decisión acarrea para sus finanzas personales.' },
        ],
      },
    ],
  },
  {
    id: 'pagos-y-tasas-de-cambio',
    title: '7. Condiciones de Pago, Anticipos y Tasas de Cambio',
    blocks: [
      { type: 'paragraph', text: 'Para garantizar la correcta gestión de compra, separación de artículos en oferta o disponibilidad en las tiendas de los Estados Unidos, Personal Shopper VIP y su representante John Reyes Calderon establecen las siguientes políticas financieras:' },
      {
        type: 'list',
        items: [
          { label: 'Anticipos y Abonos Iniciales:', text: 'Para iniciar cualquier gestión de compra por encargo, el cliente deberá realizar un anticipo o abono correspondiente al porcentaje establecido por el servicio (o el 100% del valor del artículo según lo acordado previamente). Ningún pedido será procesado ni comprado en origen sin la confirmación del pago del anticipo correspondiente.' },
          { label: 'Tasas de Cambio:', text: 'Al tratarse de compras internacionales originadas en los Estados Unidos, las cotizaciones en Pesos Colombianos (COP) se calculan con base en la tasa de cambio vigente de la divisa (Dólar USD) establecida por Personal Shopper VIP al momento de emitir la orden de pago o cotización formal. Esta tasa incluye los costos operativos de conversión y transferencia internacional de divisas.' },
          { label: 'Saldo Pendiente y Cancelación:', text: 'El saldo restante del pedido (que incluye fletes internacionales, seguros, trámites aduaneros y envíos nacionales, según aplique) deberá ser cancelado en su totalidad por el cliente antes del despacho final o entrega a domicilio del paquete en Colombia.' },
          { label: 'Política de Reembolsos por Cancelación del Cliente:', text: 'Si el cliente decide cancelar voluntariamente un pedido que ya ha sido procesado, comprado o despachado desde las tiendas en EE. UU., Personal Shopper VIP no realizará la devolución del anticipo o de los gastos ya incurridos en gestiones logísticas, impuestos o fletes internacionales. Los reembolsos excepcionales estarán sujetos a las políticas de cancelación de cada tienda de origen y acarrearán los descuentos por comisiones bancarias o de pasarelas de pago aplicadas.' },
        ],
      },
    ],
  },
  {
    id: 'reemplazos-por-garantia',
    title: '⚠️ 8. Cláusula Especial y Resaltada: Costos Asociados a Reemplazos por Garantía',
    highlighted: true,
    blocks: [
      {
        type: 'notice',
        title: 'AVISO IMPORTANTE Y OBLIGATORIO:',
        text: 'AL SER UN SERVICIO DE TRANSPORTE BAJO LA MODALIDAD DE VIAJEROS DESDE ESTADOS UNIDOS A COLOMBIA, NUESTRO COMPROMISO ES HACER QUE SUS PAQUETES LLEGUEN DEL PUNTO A AL PUNTO B. POR LO TANTO, PERSONAL SHOPPER VIP Y SU REPRESENTANTE JOHN REYES CALDERON ESTAMOS EXENTOS DE ASUMIR CUALQUIER COSTO ECONÓMICO DERIVADO DE DEVOLUCIONES, GARANTÍAS, NUEVOS ENVÍOS O REEMPLAZOS.',
      },
      { type: 'paragraph', text: 'Todo paquete que sea reemplazado por la tienda internacional y deba ser enviado nuevamente a través de nuestro casillero o centro de recepción en los Estados Unidos hacia Colombia, deberá asumir los siguientes costos logísticos e impuestos vigentes:' },
      {
        type: 'list',
        items: [
          { text: 'Impuestos o T.A.X. en EE. UU. (Si aplica según la tienda/estado).' },
          { label: 'Transporte EE. UU. a Colombia:', text: 'Tarifa por peso de $25.000 COP por libra o fracción.' },
          { label: 'Seguro de Mercancía:', text: '5% del valor declarado para artículos de más de $200 USD.' },
          { label: 'Manejo aduanero en Colombia:', text: '5%.' },
          { label: 'Envío a Domicilio final en Colombia:', text: 'Según peso y volumen (Tarifa mínima de $20.000 COP).' },
        ],
      },
    ],
  },
];
