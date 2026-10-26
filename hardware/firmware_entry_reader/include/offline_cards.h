#pragma once

// Cards that are ALWAYS allowed in when the cloud cannot be reached (Wi-Fi down,
// Supabase outage, clock never synced). Unlike the synced LittleFS allow-list,
// this list does not expire and does not need NTP time.
//
// Revoking someone on the dashboard does NOT remove them from this list while
// the door is offline — delete the line here and reflash to fully revoke.
//
// UIDs are uppercase hex with no separators, exactly as shown on the dashboard.
struct BuiltInCard {
  const char *uid;
  const char *name;
};

static const BuiltInCard BUILT_IN_CARDS[] = {
  {"8A630102", "Aryan Wesavkar"},
  {"672B0002", "Daivik Pawar"},
  {"08FB4FA9", "Daivik Pawar 2"},
  {"1AF24B07", "Jeeval Patil"},
  {"C3550F35", "Krishna Mundhara"},
  {"64194507", "Maahi Nagdeote"},
  {"BE1F4307", "Piyush Singh"},
  {"E2924307", "Raaj Patkar"},
  {"42720102", "Rushabh Makwana"},
  {"01020304", "Shubham Gupta"},
  {"76950202", "Subhra Parija"},
  {nullptr, nullptr},  // end marker — keep last
};
