var APIkey;
var OrgId;
const erasmus = [];
const eventParticipants = [];

fetch("/erasmus.json")
  .then((res) => res.json())
  .then((data) => {
    erasmus.push(...data);
  });

const title = document.getElementById("title");
const body = document.getElementById("text");
const modalBody = document.getElementById("modalBody");
const button = document.getElementById("button");
const eventBtn = document.getElementById("eventBtn");
var eventSelector = 1;

window.onload = function() {
    eventHandler(1);
  };

function eventoPrecedente() {
  eventSelector++;
  console.log("chiamato evento");
  eventHandler(eventSelector);
  title.innerHTML = "Loading"
  modalBody.innerHTML = "Loading"
  document.querySelectorAll('.list-group').forEach(function(el) {
  el.innerHTML = 'Loading';
});
}

eventBtn.addEventListener("click", eventoPrecedente);

function eventHandler(eventSelector = 1) {
  fetchAllAttendees(title, eventSelector).then((attendees) => {
    const ul = document.createElement("ul");
    ul.className = "list-group"; // Bootstrap list group

    for (const attendee of attendees) {
      const name = attendee.profile.name ?? "Unknown";
      const esnCard = attendee.answers?.[0]?.answer ?? "N/A";
      eventParticipants.push({ fullName: name, ESNCard: esnCard });

      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
      <span><strong>${name}</strong></span>
      <span class="badge bg-primary rounded-pill">${esnCard}</span>
    `;
      ul.appendChild(li);
    }

    body.innerHTML = "";
    body.appendChild(ul);
    button.classList.remove("disabled");
    button.addEventListener("click", compare);
  });
}

const compare = () => {
  modalBody.innerHTML = '<ul class="list-group">';
  for (const participant of eventParticipants) {
    let flag = true;
    for (const eras of erasmus) {
      if (eras.ESNCard === participant.ESNCard) {
        flag = false;
        break;
      }
    }
    if (flag) {
      modalBody.innerHTML += `<li class="list-group-item list-group-item-danger border border-secondary"> <b>NOME:</b> ${participant.fullName}      <b>ESNCARD:</b> ${participant.ESNCard} </li>`;
    }
  }
  modalBody.innerHTML += "</ul>";
};

async function getNpages() {
  try {
    const response = await fetch(
      `https://www.eventbriteapi.com/v3/organizations/${OrgId}/events/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${APIkey}`,
        },
      }
    );
    const data = await response.json();
    const pages = data.pagination.page_count;
    return pages;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

async function getId(title, eventSelector = 1) {
  try {
    const totalPages = await getNpages();
    const response = await fetch(
      `https://www.eventbriteapi.com/v3/organizations/${OrgId}/events/?page=${totalPages}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${APIkey}`,
        },
      }
    );
    const data = await response.json();
    //TO FIX
    const lastEvent = data.events[data.events.length - 1 * eventSelector];
    title.textContent = lastEvent.name.text;
    return lastEvent.id;
  } catch (error) {
    console.error("Error fetching last event ID:", error);
    return null;
  }
}

async function fetchAllAttendees(title, eventSelector = 1) {
  await fetchEnv();
  const baseUrl = `https://www.eventbriteapi.com/v3/events/`;
  const headers = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${APIkey}`,
    },
  };
  const allAttendees = [];

  try {
    const eventId = await getId(title, eventSelector);
    const firstResponse = await fetch(
      `${baseUrl}${eventId}/attendees/`,
      headers
    );
    const firstData = await firstResponse.json();

    const totalPages = firstData.pagination.page_count;
    allAttendees.push(...firstData.attendees);

    for (let page = 2; page <= totalPages; page++) {
      const response = await fetch(
        `${baseUrl}${eventId}/attendees/?page=${page}`,
        headers
      );
      const data = await response.json();
      allAttendees.push(...data.attendees);
    }

    return allAttendees;
  } catch (error) {
    console.error("Error fetching pages:", error);
    return [];
  }
}

async function fetchEnv() {
  try {
    const res = await fetch("/env.json");
    const data = await res.json();
    APIkey = data.APIKey;
    OrgId = data.OrgId;
  } catch (error) {
    console.error("Error fetching env.json:", error);
  }
}
