"use strict";
/**
 * @param {HTMLTableCellElement} theadCell - <table> -> <thead> -> <td> or <th>
 * @returns {HTMLTableElement} <td> or <th> -> <thead> -> <table>
 */
function initTable(theadCell)
{
    var orderNumber=-theadCell.dataset.order||1,orderString,tableHTMLElement=theadCell;
    switch(orderNumber)
    {
        case 1:
        {
            orderString="🔺";
            break;
        }
        case -1:
        {
            orderString="🔻";
            break;
        }
    }
    while(tableHTMLElement.tagName!="TABLE")tableHTMLElement=tableHTMLElement.parentElement;
    if(!tableHTMLElement.dataset.scanned)
    {
        for(let localArray=[],rowIndexNumber=0,zeroRowSpanSet=new Set();rowIndexNumber<tableHTMLElement.tHead.rows.length;rowIndexNumber++)
        {
            if(!localArray[rowIndexNumber])localArray[rowIndexNumber]=[];
            for(let cellIndexNumber=0,localNumber=0;cellIndexNumber<tableHTMLElement.tHead.rows[rowIndexNumber].cells.length;cellIndexNumber++)
            {
                while(localArray[rowIndexNumber][localNumber]||zeroRowSpanSet.has(localNumber))localNumber++;
                tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].dataset.local=localNumber;
                if(tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].rowSpan)
                {
                    for(let scanRowNumber=0;scanRowNumber<tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].rowSpan;scanRowNumber++)
                    {
                        if(!localArray[rowIndexNumber+scanRowNumber])localArray[rowIndexNumber+scanRowNumber]=[];
                        for(let scanColumnNumber=0;scanColumnNumber<tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].colSpan;scanColumnNumber++)
                        {
                            localArray[rowIndexNumber+scanRowNumber][localNumber+scanColumnNumber]=true;
                        }
                    }
                }
                else
                {
                    for(let scanColumnNumber=0;scanColumnNumber<tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].colSpan;scanColumnNumber++)
                    {
                        zeroRowSpanSet.add(localNumber+scanColumnNumber);
                    }
                }
                localNumber+=tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].colSpan;
            }
        }
        tbody:
        for(let tbodyIndexNumber=0;tbodyIndexNumber<tableHTMLElement.tBodies.length;tbodyIndexNumber++)
        {
            for(let rowIndexNumber=0;rowIndexNumber<tableHTMLElement.tBodies[tbodyIndexNumber].rows.length;rowIndexNumber++)
            {
                for(let cellIndexNumber=0;cellIndexNumber<tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells.length;cellIndexNumber++)
                {
                    if(tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells[cellIndexNumber].rowSpan!=1)continue tbody;
                }
            }
            tableHTMLElement.tBodies[tbodyIndexNumber].dataset.sortable=true;
        }
        tableHTMLElement.dataset.scanned=true;
    }
    for(let rowIndexNumber=0;rowIndexNumber<tableHTMLElement.tHead.rows.length;rowIndexNumber++)
    {
        for(let cellIndexNumber=0;cellIndexNumber<tableHTMLElement.tHead.rows[rowIndexNumber].cells.length;cellIndexNumber++)
        {
            if(tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].dataset.local==theadCell.dataset.local&&tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].colSpan<=theadCell.colSpan)
            {
                if(!tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].dataset.order)
                {
                    tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].appendChild(document.createElement("font"));
                    tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].lastElementChild.color="red";
                    tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].lastElementChild.size=1;
                }
                else if(!+tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].dataset.order)tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].lastElementChild.hidden=false;
                tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].dataset.order=orderNumber;
                tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].lastElementChild.textContent=orderString;
            }
            else if(+tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].dataset.order)
            {
                tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].dataset.order=0;
                tableHTMLElement.tHead.rows[rowIndexNumber].cells[cellIndexNumber].lastElementChild.hidden=true;
            }
        }
    }
    return tableHTMLElement;
}
/**
 * @param {Number} order - -1 or +1
 * @returns {(left:Number,right:Number)=>Number}
 * if(left>right)return +number; //+number>0
 * if(left==right)return 0;
 * if(left<right)return -number; //-number<0
 */
function getNumberComparatorFunction(order)
{
    switch(order)
    {
        case 1:
        {
            return function(left,right)
            {
                if(isNaN(left)||isNaN(right))
                {
                    if(!isNaN(left))return -1;
                    if(!isNaN(right))return 1;
                    return 0;
                }
                else return left-right;
            };
        }
        case -1:
        {
            return function(left,right)
            {
                if(isNaN(left)||isNaN(right))
                {
                    if(!isNaN(left))return -1;
                    if(!isNaN(right))return 1;
                    return 0;
                }
                else return right-left;
            };
        }
    }
}
/**
 * @param {Number} order - -1 or +1
 * @param {String|String[]} [language=""] - IETF BCP 47 Language Tag
 * @param {Object} [options=null]
 *  - https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Collator
 * @param {Boolean} [useIntlCollator=false] - true or false
 * @returns {(left:String,right:String)=>Number}
 * if(left>right)return +number; //+number>0
 * if(left==right)return 0;
 * if(left<right)return -number; //-number<0
 */
function getStringComparatorFunction(order,language,options,useIntlCollator)
{
    switch(order)
    {
        case 1:
        {
            if(!language)return function(left,right)
            {
                return left==right?0:left>right?1:-1;
            };
            else if(!useIntlCollator)return function(left,right)
            {
                return left.localeCompare(right,language,options);
            };
            else
            {
                const intlCollator=new Intl.Collator(language,options);
                return function(left,right)
                {
                    return intlCollator.compare(left,right);
                };
            }
        }
        case -1:
        {
            if(!language)return function(left,right)
            {
                return left==right?0:left<right?1:-1;
            };
            else if(!useIntlCollator)return function(left,right)
            {
                return right.localeCompare(left,language,options);
            };
            else
            {
                const intlCollator=new Intl.Collator(language,options);
                return function(left,right)
                {
                    return intlCollator.compare(right,left);
                };
            }
        }
    }
}
/**
 * @param {HTMLTableCellElement} theadCell - <table> -> <thead> -> <td> or <th>
 * @param {String|String[]} [locales=""] - IETF BCP 47 Language Tag
 * @param {Object} [options=null]
 *  - https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Collator
 */
function tableSort(theadCell,locales,options)
{
    var tableComparatorFunction,tableHTMLElement=initTable(theadCell),tableLangString;
    if(!locales)
    {
        for(let node=tableHTMLElement;!tableLangString&&node.parentNode;node=node.parentNode)
        {
            tableLangString=node.lang;
        }
    }
    for(let tbodyIndexNumber=0;tbodyIndexNumber<tableHTMLElement.tBodies.length;tbodyIndexNumber++)
    {
        if(tableHTMLElement.tBodies[tbodyIndexNumber].dataset.sortable)
        {
            let rowInfoArray=[],tbodyComparatorFunction;
            if(locales)tbodyComparatorFunction=tableComparatorFunction||(tableComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order,locales,options,true));
            else
            {
                let tbodyLangString;
                for(let node=tableHTMLElement.tBodies[tbodyIndexNumber];!tbodyLangString&&node.nodeName!="TABLE";node=node.parentNode)
                {
                    tbodyLangString=node.lang;
                }
                if(tbodyLangString)tbodyComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order,tbodyLangString,options);
                else tbodyComparatorFunction=tableComparatorFunction||(tableComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order,tableLangString,options,true));
            }
            for(let rowIndexNumber=0;rowIndexNumber<tableHTMLElement.tBodies[tbodyIndexNumber].rows.length;rowIndexNumber++)
            {
                let cellIndexNumber=0,localNumber=0;
                while(cellIndexNumber<tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells.length&&localNumber+tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells[cellIndexNumber].colSpan<=theadCell.dataset.local)
                {
                    localNumber+=tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells[cellIndexNumber].colSpan;
                    cellIndexNumber++;
                }
                rowInfoArray.push([tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber],{cellIndex:cellIndexNumber,local:localNumber}]);
            }
            rowInfoArray.sort(function(upRowInfo,downRowInfo)
            {
                let downRowCellIndexNumber=downRowInfo[1].cellIndex,downRowLocalNumber=downRowInfo[1].local,upRowCellIndexNumber=upRowInfo[1].cellIndex,upRowLocalNumber=upRowInfo[1].local;
                while(downRowCellIndexNumber<downRowInfo[0].cells.length&&upRowCellIndexNumber<upRowInfo[0].cells.length)
                {
                    const resultNumber=tbodyComparatorFunction(upRowInfo[0].cells[upRowCellIndexNumber].innerText,downRowInfo[0].cells[downRowCellIndexNumber].innerText);
                    if(!resultNumber)
                    {
                        const downRowNextLocalNumber=downRowLocalNumber+downRowInfo[0].cells[downRowCellIndexNumber].colSpan,upRowNextLocalNumber=upRowLocalNumber+upRowInfo[0].cells[upRowCellIndexNumber].colSpan;
                        if(Math.min(downRowNextLocalNumber,upRowNextLocalNumber)>=+theadCell.dataset.local+theadCell.colSpan)return 0;
                        if(upRowNextLocalNumber<downRowNextLocalNumber)
                        {
                            upRowCellIndexNumber++;
                            upRowLocalNumber=upRowNextLocalNumber;
                        }
                        else if(upRowNextLocalNumber>downRowNextLocalNumber)
                        {
                            downRowCellIndexNumber++;
                            downRowLocalNumber=downRowNextLocalNumber;
                        }
                        else
                        {
                            upRowCellIndexNumber++;
                            downRowCellIndexNumber++;
                            upRowLocalNumber=upRowNextLocalNumber;
                            downRowLocalNumber=downRowNextLocalNumber;
                        }
                    }
                    else return resultNumber;
                }
                if(upRowCellIndexNumber<upRowInfo[0].cells.length)return -1;
                if(downRowCellIndexNumber<downRowInfo[0].cells.length)return 1;
                return 0;
            });
            rowInfoArray.forEach(function(rowInfo)
            {
                tableHTMLElement.tBodies[tbodyIndexNumber].appendChild(rowInfo[0]);
            });
        }
    }
}