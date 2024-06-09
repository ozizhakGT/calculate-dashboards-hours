// ==UserScript==
// @name                Calculate Hours
// @match               https://connectedhs.atlassian.net/jira/dashboards/*
// @version             0.1
// @description         Shows the total of hours in the footer
// @copyright           2024, Oz Izhak
// @author              Oz Izhak
// ==/UserScript==
"use strict";

const WORK_DAY = 8
const COLUMNS = [undefined, undefined, undefined, undefined, undefined, "timeoriginalestimate", "timespent", "timeestimate", undefined, undefined, undefined, undefined]
const UNIQE_ID = "totalRowOzey"

const getDashboards = () => {
    return Array(...document.querySelectorAll(".issue-table") || [])
}

const serializeTotalRowDashboardRow = (dashboard) => {
    let totalRowData = {};
    const lines = Array(...dashboard.querySelector("tbody")?.children || []).filter(line => !line.id.startsWith(UNIQE_ID));

    if(lines.length) {
        lines.reduce((totalRow, line) => {
            const lineColumns = Array(...line.children)

            lineColumns.forEach((lineColumn, lineColumnIndex) => {
                const col = COLUMNS.find(colName => colName === lineColumn.className);

                if(!totalRow[lineColumn.className]) {
                    totalRow[lineColumn.className] = {
                        sum: 0
                    }
                }

                if (col) {
                    const lineHours = Number(lineColumn.innerText.replace(/\D/g, "") || 0);
                    totalRow[lineColumn.className].sum += lineHours;
                } else {
                    totalRow[lineColumn.className].sum = undefined;
                }
            })

            return totalRow;
        }, totalRowData)
    }

    return totalRowData;
}

const normalizeHoursToDays = (totalRow) => {

    Object.keys(totalRow).forEach(key => {
        if (totalRow[key].sum) {
            const days = totalRow[key].sum / WORK_DAY
            totalRow[key].days = days >= 1 ? Math.floor(days) : undefined;

            const hours = WORK_DAY * (totalRow[key].days ? days - totalRow[key].days : days)
            totalRow[key].hours = hours >= 1 ? Math.floor(hours) : undefined;

            totalRow[key].minutes = 60 * (totalRow[key].hours ? hours - totalRow[key].hours : hours)
        }
    })
}

const buildDashboardTotalRowElement = (totalRow) => {
    const tdsArr = COLUMNS.map((colName, index) => {
        const colData = totalRow[colName];

        if (colData) {
            return `<td class="${colName}" style="font-weight: bold">
            ${colData.days ? `${colData.days}D${colData.hours ? "," : ""}` : ""} ${colData.hours ? `${colData.hours}H${colData.minutes ? "," : ""}` : ""} ${colData.minutes ? `${colData.minutes}M` : ""}
            </td>`
        } else if(index === 0) {
            return '<td style="font-weight: bold">Total</td>'
        }

        return "<td></td>"
    });

    return tdsArr.join("");
}

const init = () => {
    setInterval(() => {
        const dashboards = getDashboards();

        if(dashboards.length) {
            const dashboardsTotals = dashboards.map(serializeTotalRowDashboardRow);
            dashboardsTotals.forEach(normalizeHoursToDays);

            dashboardsTotals.forEach((totalRow, index) => {
            const existTotalRow = document.getElementById(`${UNIQE_ID}${index}`);
            existTotalRow?.parentElement.removeChild(existTotalRow);

            const constdashboardTBody = dashboards[index].querySelector("tbody");
            const totalRowEl = buildDashboardTotalRowElement(totalRow)

            constdashboardTBody.insertAdjacentHTML("beforeend", `<tr id="${UNIQE_ID}${index}" style="background-color: #bfbfbf">${totalRowEl}</tr>`);
        })
        }
    }, 1000)
}

window.addEventListener("load", init);
