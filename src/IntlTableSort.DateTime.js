"use strict";
/**
 * @param {String} [toString=""] - "Date" or "Time" or "DateTime" or "Custom"
 * @param {String|String[]} [language=""] - IETF BCP 47 Language Tag
 * @param {Object} [options=null]
 *  - https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
 * @returns {(dateTime:Date)=>String}
 */
function getDateTimeFormatFunction(toString,language,options)
{
    switch(toString?toString.toLowerCase():"")
    {
        case "date":
        {
            if(!language)return function(dateTime)
            {
                return dateTime.toDateString();
            }
            else return function(dateTime)
            {
                return dateTime.toLocaleDateString(language,options);
            }
        }
        case "time":
        {
            if(!language)return function(dateTime)
            {
                return dateTime.toTimeString();
            }
            else return function(dateTime)
            {
                return dateTime.toLocaleTimeString(language,options);
            }
        }
        case "datetime":
        {
            if(!language)return function(dateTime)
            {
                return dateTime.toString();
            }
            else return function(dateTime)
            {
                return dateTime.toLocaleString(language,options);
            }
        }
        case "custom":
        {
            if(language)
            {
                const intlDateTimeFormat=new Intl.DateTimeFormat(language,options);
                return function(dateTime)
                {
                    return intlDateTimeFormat.format(dateTime);
                }
            }
        }
        default:
        {
            return function(datetime)
            {
                return +datetime+"";
            }
        }
    }
}
/**
 * @param {HTMLTableCellElement} theadCell - <table> -> <thead> -> <td> or <th>
 * @param {String} [setToTitleString=""] - "Date" or "Time" or "DateTime" or "Custom"
 * @param {String|String[]} [locales=""] - IETF BCP 47 Language Tag
 * @param {Object} [options=null]
 *  - https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Collator
 *  & https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
 */
function dateTimeTableSort(theadCell,setToTitleString,locales,options)
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
        let tbodyFormatFunction,tbodyLangString;
        if(tableHTMLElement.tBodies[tbodyIndexNumber].dataset.sortable)
        {
            let rowInfoArray=[],tbodyComparatorFunction;
            if(locales)tbodyComparatorFunction=tableStringComparatorFunction||(tableStringComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order,locales,options,true));
            else
            {
                for(let node=tableHTMLElement.tBodies[tbodyIndexNumber];!tbodyLangString&&node.nodeName!="TABLE";node=node.parentNode)
                {
                    tbodyLangString=node.getAttribute("lang");
                }
                if(tbodyLangString)tbodyComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order,tbodyLangString,options);
                else if(tableLangString)tbodyComparatorFunction=tableStringComparatorFunction||(tableStringComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order,tableLangString,options,true));
                else tbodyComparatorFunction=tableStringComparatorFunction||(tableStringComparatorFunction=getStringComparatorFunction(+theadCell.dataset.order));
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
            if(setToTitleString)
            {
                if(locales)tbodyFormatFunction=tableFormatFunction||(tableFormatFunction=getDateTimeFormatFunction(setToTitleString,locales,options));
                else if(tbodyLangString)tbodyFormatFunction=getDateTimeFormatFunction(setToTitleString,tbodyLangString,options);
                else if(tableLangString)tbodyFormatFunction=tableFormatFunction||(tableFormatFunction=getDateTimeFormatFunction(setToTitleString,tableLangString,options));
                else tbodyFormatFunction=tableFormatFunction||(tableFormatFunction=getDateTimeFormatFunction(setToTitleString));
                rowInfoArray.forEach(function(rowInfo)
                {
                    for(let cellIndexNumber=rowInfo[1],localNumber=rowInfo[2];cellIndexNumber<rowInfo[0].cells.length&&localNumber<+theadCell.dataset.local+theadCell.colSpan;localNumber+=rowInfo[0].cells[cellIndexNumber].colSpan,cellIndexNumber++)
                    {
                        const datetime=new Date(rowInfo[0].cells[cellIndexNumber].innerText);
                        if(!isNaN(+datetime))rowInfo[0].cells[cellIndexNumber].setAttribute("title",tbodyFormatFunction(datetime));
                    }
                });
            }
            rowInfoArray.sort(function(upRowInfo,downRowInfo)
            {
                let downRowCellIndexNumber=downRowInfo[1],downRowLocalNumber=downRowInfo[2],upRowCellIndexNumber=upRowInfo[1],upRowLocalNumber=upRowInfo[2];
                while(downRowCellIndexNumber<downRowInfo[0].cells.length&&upRowCellIndexNumber<upRowInfo[0].cells.length)
                {
                    const downDateTime=new Date(downRowInfo[0].cells[downRowCellIndexNumber].innerText),upDateTime=new Date(upRowInfo[0].cells[upRowCellIndexNumber].innerText),resultNumber=isNaN(+downDateTime)&&isNaN(+upDateTime)?tbodyComparatorFunction(upRowInfo[0].cells[upRowCellIndexNumber].innerText,downRowInfo[0].cells[downRowCellIndexNumber].innerText):tableNumberComparatorFunction(+upDateTime,+downDateTime);
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
        else if(setToTitleString)
        {
            if(locales)tbodyFormatFunction=tableFormatFunction||(tableFormatFunction=getDateTimeFormatFunction(setToTitleString,locales,options));
            else
            {
                for(let node=tableHTMLElement.tBodies[tbodyIndexNumber];!tbodyLangString&&node.nodeName!="TABLE";node=node.parentNode)
                {
                    tbodyLangString=node.getAttribute("lang");
                }
                if(tbodyLangString)tbodyFormatFunction=getDateTimeFormatFunction(setToTitleString,tbodyLangString,options);
                else if(tableLangString)tbodyFormatFunction=tableFormatFunction||(tableFormatFunction=getDateTimeFormatFunction(setToTitleString,tableLangString,options));
                else tbodyFormatFunction=tableFormatFunction||(tableFormatFunction=getDateTimeFormatFunction(setToTitleString));
            }
            for(let localArray=[],rowIndexNumber=0;rowIndexNumber<tableHTMLElement.tBodies[tbodyIndexNumber].rows.length;rowIndexNumber++)
            {
                let cellIndexNumber=0,localNumber=0;
                if(!localArray[rowIndexNumber])localArray[rowIndexNumber]=[];
                while(localArray[rowIndexNumber][localNumber])localNumber++;
                while(cellIndexNumber<tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells.length&&localNumber<+theadCell.dataset.local+theadCell.colSpan)
                {
                    if(localNumber+tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells[cellIndexNumber].colSpan>theadCell.dataset.local)
                    {
                        const datetime=new Date(tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells[cellIndexNumber].innerText);
                        if(!isNaN(+datetime))tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells[cellIndexNumber].setAttribute("title",tbodyFormatFunction(datetime));
                    }
                    for(let scanRowNumber=0;scanRowNumber<tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells[cellIndexNumber].rowSpan;scanRowNumber++)
                    {
                        if(!localArray[rowIndexNumber+scanRowNumber])localArray[rowIndexNumber+scanRowNumber]=[];
                        for(let scanColumnNumber=0;scanColumnNumber<tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells[cellIndexNumber].colSpan;scanColumnNumber++)
                        {
                            localArray[rowIndexNumber+scanRowNumber][localNumber+scanColumnNumber]=true;
                        }
                    }
                    localNumber+=tableHTMLElement.tBodies[tbodyIndexNumber].rows[rowIndexNumber].cells[cellIndexNumber].colSpan;
                    while(localArray[rowIndexNumber][localNumber])localNumber++;
                    cellIndexNumber++;
                }
            }
        }
    }
}
