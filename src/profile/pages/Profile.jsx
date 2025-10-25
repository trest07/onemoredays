import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProfileById, getMyProfile } from "../lib/profile.js";
import ProfileHeaderLite from "../components/ProfileHeaderLite.jsx";
import ProfileTabs from "../components/ProfileTabs.jsx";
import ProfileAbout from "../components/ProfileAbout.jsx";
import ProfileDrops from "../components/ProfileDrops.jsx";
import TripsPanel from "../../trips/components/TripsPanel.jsx";
import ProfilePhotos from "../components/ProfilePhotos.jsx";
import Loading from "../../components/Loading.jsx";
import ConnectionsTab from "../components/ConnectionsTab.jsx";

/**
 * Profile.jsx
 * - Public profile page with tabs: Drops, Trips, Photos, Connections, About
 * - Loads profile by :id or shows logged-in user’s profile
 */
export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        let data;
        if (id) {
          data = await getProfileById(id);
          setIsOwner(false);
        } else {
          data = await getMyProfile();
          setIsOwner(true);
        }
        if (mounted) setProfile(data);
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <Loading text="Loading profile…" />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!profile) return <div className="p-4">Profile not found.</div>;

  const tabs = [
    { key: "drops", label: "Drops" },
    { key: "trips", label: "Trips" },
    { key: "photos", label: "Photos" },
    { key: "connections", label: "Connections" },
    { key: "about", label: "About" },
  ];

  return (
    <div>
      <ProfileHeaderLite profile={profile} isOwner={isOwner} />

      <ProfileTabs tabs={tabs} defaultActiveKey="drops">
        <ProfileTabs.Panel tabKey="drops">
          <ProfileDrops profileId={profile.id} />
        </ProfileTabs.Panel>

        <ProfileTabs.Panel tabKey="trips">
          <TripsPanel profileId={profile.id} />
        </ProfileTabs.Panel>

        <ProfileTabs.Panel tabKey="photos">
          <ProfilePhotos isOwner={isOwner} profile={profile}/>
        </ProfileTabs.Panel>

        <ProfileTabs.Panel tabKey="connections">
          <ConnectionsTab profileId={profile.id} isOwner={isOwner}/>
        </ProfileTabs.Panel>

        <ProfileTabs.Panel tabKey="about">
          <ProfileAbout profile={profile} isOwner={isOwner} />
        </ProfileTabs.Panel>
      </ProfileTabs>
    </div>
  );
}
