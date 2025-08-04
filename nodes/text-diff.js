//===================================================================
// Node function
//===================================================================
module.exports = function(RED)
{
    function textDiffNode(config)
	{
		RED.nodes.createNode(this,config);
		const node = this;

		node.on('input', function(msg, send, done)
		{
			//console.log("Received msg",msg);
			let temp = getStringParam("diffMode",msg,config);
			const diffMode = (temp === 'W' || temp === 'C') ? temp : 'L';
			
			temp = getBoolParam("ignoreWS",msg,config);
			const ignoreWS = (typeof temp === "boolean") ? temp : true;
			
			temp = getBoolParam("caseSensitive",msg,config);
			const caseSensitive = (typeof temp === "boolean") ? temp : false;
			
			const oldArray = parseToArray(diffMode,(typeof msg.oldText === "string") ? msg.oldText : "",ignoreWS);
			const newArray = parseToArray(diffMode,(typeof msg.newText === "string") ? msg.newText : "",ignoreWS);

			msg.oldArray = oldArray;
			msg.newArray = newArray;
			msg.diffs = lcsDiff(diffMode,oldArray,newArray,ignoreWS,caseSensitive);
			send(msg);
			done();
		});
	}
    RED.nodes.registerType("Omrid01_textDiff",textDiffNode);
}
//===================================================================
// Parse & LCS diff
//===================================================================
function parseToArray(diffMode,textBlock,ignoreWS)
{
	let arr = [];
	if (textBlock !== "")
	switch (diffMode)
	{
		case "L":
			if (ignoreWS)
				arr = textBlock.trim().split(/\r?\n/).filter(Boolean);
			else
			{
				arr = textBlock.split(/\r?\n/);
				if (arr.length && arr[arr.length - 1] === '')
				arr.pop();
			}
			break;
		case "W":
			arr = textBlock.trim().split(/\s+/).filter(Boolean);
			break;
		case "C":
			for (let i = 0 ; i < textBlock.length ; i++)
				arr[i] = textBlock.charAt(i);
			break;
	}
	return arr;
}
function lcsDiff(diffMode,oldArray,newArray,ignoreWS,caseSensitive)
{
	const changes = [];
	const lcsMatrix = Array(oldArray.length + 1)
		.fill(null)
		.map(() => Array(newArray.length + 1).fill(0));

	// Build LCS matrix
	for (let i = 1; i <= oldArray.length; i++) {
	for (let j = 1; j <= newArray.length; j++) {
	  if (compare(diffMode,oldArray[i - 1],newArray[j - 1],ignoreWS,caseSensitive)) {
		lcsMatrix[i][j] = lcsMatrix[i - 1][j - 1] + 1;
	  } else {
		lcsMatrix[i][j] = Math.max(lcsMatrix[i - 1][j], lcsMatrix[i][j - 1]);
	  }
	}}

	// Backtrack to find changes
	let i = oldArray.length;
	let j = newArray.length;
	while (i > 0 || j > 0) {
	if (i > 0 && j > 0 && compare(diffMode,oldArray[i - 1],newArray[j - 1],ignoreWS,caseSensitive)) {
		changes.push({ diffType: 'match',oldIndex: (i - 1)+1, newIndex: (j - 1)+1, oldStr:oldArray[i - 1],newStr: newArray[j - 1] });
	  i--;
	  j--;
	} else if (j > 0 && (i === 0 || lcsMatrix[i][j - 1] >= lcsMatrix[i - 1][j])) {
	  changes.push({ diffType: 'added', oldIndex: '', newIndex: (j - 1)+1, oldStr:'',newStr: newArray[j - 1] });
	  j--;
	} else if (i > 0 && (j === 0 || lcsMatrix[i][j - 1] < lcsMatrix[i - 1][j])) {
	  changes.push({ diffType: 'removed', oldIndex: (i - 1)+1, newIndex: '', oldStr: oldArray[i - 1],newStr:'' });
	  i--;
	}}

	return changes.reverse();

	function compare(diffMode,oldStr,newStr,ignoreWS,caseSensitive)
	{
		if (!caseSensitive)
		{
		  oldStr = oldStr.toLowerCase();
		  newStr = newStr.toLowerCase();
		}
		//console.log("Comparing old |"+oldStr+"| to new |"+newStr+"|");
		switch (diffMode)
		{
			case 'W':
			case 'C':
				break;
			case 'L':
				if (ignoreWS)
				{
				  oldStr = oldStr.replace(/\s+/g, ' ').trim();
				  newStr = newStr.replace(/\s+/g, ' ').trim();
				}
				break;
		}
		return oldStr === newStr;
	}
}
//===================================================================
// Input parameter handling
//===================================================================
// Get string parameter from either msg property or configured node property
function getStringParam(paramName,msg,config)
{
// If not found, returns 'undefined'. If invalid, returns null. Else returns the trimmed value
//--------------------------------------------------------------------------------------------
	// 1st priority: try to take from msg property
	if (msg && msg.hasOwnProperty(paramName))
		return strVal(msg[paramName]);

	// Else, take from configured node property
	if (config && config.hasOwnProperty(paramName))
		return strVal(config[paramName]);

	return undefined; // Parameter not found
}
function strVal(param)
{
	if (param === undefined || param === null)
		return param;
	switch (typeof param)
	{
		case "string":
			return param.trim();
		case "number":
			return String(param);
		default:
			return null;
	}
}
//---------------------------------------------------------------------------
// Get boolean parameter from either msg property or configured node property
function getBoolParam(paramName,msg,config)
{
// If not found, returns 'undefined'. If empty string returns "". If non-boolean, returns null. Else returns bool value true/false
//------------------------------------------------------------------------------------------------

	// 1st priority: take from msg
	if (msg && msg.hasOwnProperty(paramName))
		return boolVal(msg[paramName]);

	// Else, take from configured node property
	if (config && config.hasOwnProperty(paramName))
		return boolVal(config[paramName]);

	return undefined;	// Parameter not found
}
function boolVal(param)
{
	if (param === undefined || param === null)
		return param;
	switch (typeof param)
	{
		case "boolean":
			return param;
		case "string":
			if (param.trim() === "")
				return "";
			else
				return null;
		default:
			return null;
	}
}