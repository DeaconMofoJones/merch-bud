$(".index0").transition("slide left");


var indexVal = 0;

console.log(indexVal)

function increment(val){
		indexVal+=val;
		console.log(indexVal)	

	
}

$("#plus1").click(function() {
	if ($(".index"+(indexVal+1)).get().length!=0) {
		$(".index"+indexVal).transition("fly right");
		increment(1);
		$(".index"+indexVal).transition("fly left");
	}
})

$("#minus1").click(function() {
	if ($(".index"+(indexVal-1)).get().length!=0) {
		$(".index"+indexVal).transition("fly left");
		increment(-1);
		$(".index"+indexVal).transition("fly right");
	}
})
