"use strict";
/**
 * @param {String} [toCase=""] - "Lower" or "Upper"
 * @param {String|String[]} [language=""] - IETF BCP 47 Language Tag
 * @returns {(string:String)=>String}
 * switch(toCase)
 * {
 *     case "Lower":return string.toLowerCase();
 *     case "Upper":return string.toUpperCase();
 *     default:return string.toString();
 * }
 */
function getStringToCaseFunction(toCase,language)
{
    switch(toCase?toCase.toLowerCase():"")
    {
        case "lower":
        {
            if(language)return function(string)
            {
                return string.toLocaleLowerCase(language);
            };
            else return function(string)
            {
                return string.toLowerCase();
            };
        }
        case "upper":
        {
            if(language)return function(string)
            {
                return string.toLocaleUpperCase(language);
            };
            else return function(string)
            {
                return string.toUpperCase();
            };
        }
        default:
        {
            return function(string)
            {
                return string.toString();
            };
        }
    }
}
/**
 * @param {HTMLTableCellElement} theadCell - <table> -> <thead> -> <td> or <th>
 * @param {String} [toCase=""] - "Lower" or "Upper"
 * @param {String|String[]} [locales=""] - IETF BCP 47 Language Tag
 * @param {Object} [options=null]
 *  - https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Collator
 */
function stringTableSort(theadCell,toCase,locales,options)
{
    var tableComparatorFunction,tableHTMLElement=initTable(theadCell),tableLangString,tableStringToCaseFunction;
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
            let rowInfoArray=[],tbodyComparatorFunction,tbodyStringToCaseFunction;
            if(locales)
            {
                tbodyStringToCaseFunction=tableStringToCaseFunction||(tableStringToCaseFunction=getStringToCaseFunction(toCase,locales));
                tbodyComparatorFunction=tableComparatorFunction||(tableComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order,locales,options,true));
            }
            else
            {
                let tbodyLangString;
                for(let node=tableHTMLElement.tBodies[tbodyIndexNumber];!tbodyLangString&&node.nodeName!="TABLE";node=node.parentNode)
                {
                    tbodyLangString=node.lang;
                }
                if(tbodyLangString)
                {
                    tbodyStringToCaseFunction=getStringToCaseFunction(toCase,tbodyLangString);
                    tbodyComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order,tbodyLangString,options);
                }
                else
                {
                    tbodyStringToCaseFunction=tableStringToCaseFunction||(tableStringToCaseFunction=getStringToCaseFunction(toCase,tableLangString));
                    tbodyComparatorFunction=tableComparatorFunction||(tableComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order,tableLangString,options,true));
                }
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
                    const resultNumber=tbodyComparatorFunction(tbodyStringToCaseFunction(upRowInfo[0].cells[upRowCellIndexNumber].innerText),tbodyStringToCaseFunction(downRowInfo[0].cells[downRowCellIndexNumber].innerText));
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