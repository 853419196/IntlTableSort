﻿"use strict";
/**
 * @param {String|String[]} [language=""] - IETF BCP 47 Language Tag
 * @param {Object} [options=null]
 *  - https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
 * @param {Boolean} [useIntlCollator=false] - true or false
 * @returns {(number:Number)=>String}
 */
function getNumberFormatFunction(language,options,useIntlCollator)
{
    if(!language)return function(number)
    {
        return number.toString();
    }
    else if(!useIntlCollator)return function(number)
    {
        return number.toLocaleString(language,options);
    }
    else
    {
        const intlNumberFormat=new Intl.NumberFormat(language,options);
        return function(number)
        {
            return intlNumberFormat.format(number);
        }
    }
}
/**
 * @param {HTMLTableCellElement} theadCell - <table> -> <thead> -> <td> or <th>
 * @param {Boolean} [setTitle=false] - true or false
 * @param {String|String[]} [locales=""] - IETF BCP 47 Language Tag
 * @param {Object} [options=null]
 *  - https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Collator
 *  & https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
 */
function numberTableSort(theadCell,setTitle,locales,options)
{
    var tableFormatFunction,tableHTMLElement=initTable(theadCell),tableNumberComparatorFunction=getNumberComparatorFunction(+theadCell.dataset.order),tableStringComparatorFunction,tableLangString;
    if(!locales)
    {
        for(let node=tableHTMLElement;!tableLangString&&node.parentNode;node=node.parentNode)
        {
            tableLangString=node.getAttribute("lang");
        }
    }
    for(let tbodyIndexNumber=0;tbodyIndexNumber<tableHTMLElement.tBodies.length;tbodyIndexNumber++)
    {
        if(tableHTMLElement.tBodies[tbodyIndexNumber].dataset.sortable)
        {
            let rowInfoArray=[],tbodyComparatorFunction,tbodyLangString;
            if(locales)tbodyComparatorFunction=tableStringComparatorFunction||(tableStringComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order,locales,options,true));
            else
            {
                for(let node=tableHTMLElement.tBodies[tbodyIndexNumber];!tbodyLangString&&node.nodeName!="TABLE";node=node.parentNode)
                {
                    tbodyLangString=node.getAttribute("lang");
                }
                if(tbodyLangString)tbodyComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order,tbodyLangString,options);
                else if(tableLangString)tbodyComparatorFunction=tableStringComparatorFunction||(tableStringComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order,tableLangString,options,true));
                else tbodyComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order);
            }
            for(let rowIndexNumber=0;rowIndexNumber<tableHTMLElement.tBodies[tbodyIndexNumber].rows.length;rowIndexNumber++)
            {
                let cellIndexNumber=0,localNumber=0;
                while(cellIndexNumber<tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells.length&&localNumber+tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells[cellIndexNumber].colSpan<=theadCell.dataset.local)
                {
                    localNumber+=tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells[cellIndexNumber].colSpan;
                    cellIndexNumber++;
                }
                rowInfoArray.push([tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber],cellIndexNumber,localNumber]);
            }
            if(setTitle)
            {
                let tbodyFormatFunction;
                if(locales)tbodyFormatFunction=tableFormatFunction||(tableFormatFunction=getNumberFormatFunction(locales,options,true));
                else if(tbodyLangString)tbodyFormatFunction=getNumberFormatFunction(tbodyLangString,options);
                else if(tableLangString)tbodyFormatFunction=tableFormatFunction||(tableFormatFunction=getNumberFormatFunction(tableLangString,options,true));
                else tbodyFormatFunction=getNumberFormatFunction();
                rowInfoArray.forEach(function(rowInfo)
                {
                    for(let cellIndexNumber=rowInfo[1],localNumber=rowInfo[2];cellIndexNumber<rowInfo[0].cells.length&&localNumber<+theadCell.dataset.local+theadCell.colSpan;localNumber+=rowInfo[0].cells[cellIndexNumber].colSpan,cellIndexNumber++)
                    {
                        if(!isNaN(rowInfo[0].cells[cellIndexNumber].innerText))rowInfo[0].cells[cellIndexNumber].setAttribute("title",tbodyFormatFunction(+rowInfo[0].cells[cellIndexNumber].innerText));
                    }
                });
            }
            rowInfoArray.sort(function(upRowInfo,downRowInfo)
            {
                let downRowCellIndexNumber=downRowInfo[1],downRowLocalNumber=downRowInfo[2],upRowCellIndexNumber=upRowInfo[1],upRowLocalNumber=upRowInfo[2];
                while(downRowCellIndexNumber<downRowInfo[0].cells.length&&upRowCellIndexNumber<upRowInfo[0].cells.length)
                {
                    const resultNumber=isNaN(downRowInfo[0].cells[downRowCellIndexNumber].innerText)&&isNaN(upRowInfo[0].cells[upRowCellIndexNumber].innerText)?tbodyComparatorFunction(upRowInfo[0].cells[upRowCellIndexNumber].innerText,downRowInfo[0].cells[downRowCellIndexNumber].innerText):tableNumberComparatorFunction(+upRowInfo[0].cells[upRowCellIndexNumber].innerText,+downRowInfo[0].cells[downRowCellIndexNumber].innerText);
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