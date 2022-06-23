exports.deleteReturnRequirementPurposes = `delete from water.return_requirement_purposes rp
using 
    water.licences l,
    water.return_requirements rr,
    water.return_versions rv
  where
    rp.return_requirement_id=rr.return_requirement_id
    and rr.return_version_id=rv.return_version_id
    and rv.licence_id=l.licence_id 
    and l.is_test=true;`

exports.deleteReturnRequirements = `delete from water.return_requirements rr
using 
    water.licences l,
    water.return_versions rv
  where    
    rr.return_version_id=rv.return_version_id
    and rv.licence_id=l.licence_id 
    and l.is_test=true;`

exports.deleteReturnVersions = `delete from water.return_versions rv
using 
    water.licences l    
  where    
    rv.licence_id=l.licence_id 
    and l.is_test=true;`
