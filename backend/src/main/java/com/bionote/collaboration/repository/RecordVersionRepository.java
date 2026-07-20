package com.bionote.collaboration.repository;

import com.bionote.collaboration.entity.RecordVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecordVersionRepository extends JpaRepository<RecordVersion, String> {

    List<RecordVersion> findByRecordIdOrderByVersionNoDesc(String recordId);

    Optional<RecordVersion> findByRecordIdAndVersionNo(String recordId, Long versionNo);
}
