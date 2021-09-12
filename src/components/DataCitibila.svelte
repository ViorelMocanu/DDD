<script>
  export let dataNecitibila, eScurta;
  let dataCitibila = (dataNecitibila) => {
    if (!dataNecitibila || dataNecitibila.length == 0) return false;
    const publishTime = new Date(dataNecitibila);
    const ziua = publishTime.getDate();
    const lunaIndex = publishTime.getMonth();
    const luni = [
      'Ianuarie',
      'Februarie',
      'Martie',
      'Aprilie',
      'Mai',
      'Iunie',
      'Iulie',
      'August',
      'Septembrie',
      'Octombrie',
      'Noiembrie',
      'Decembrie',
    ];
    const luna = luni[lunaIndex];
    const anul = publishTime.getFullYear();
    const ora = publishTime.getHours();
    const min = publishTime.getMinutes();
    let readableDate = '';
    if (eScurta === true) {
      readableDate = ziua + ' ' + luna.substring(0, 3) + ' ' + anul;
    } else {
      readableDate = ziua + ' ' + luna + ' ' + anul + ' la ora ' + ora + ':' + min;
    }
    return readableDate;
  };
</script>

<span>{dataCitibila(dataNecitibila)}</span>
