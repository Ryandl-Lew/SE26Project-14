package com.bionote.record.repository;

import com.bionote.record.entity.RecordVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecordVersionRepository extends JpaRepository<RecordVersion, String> {

    List<RecordVersion> findByRecordIdOrderByVersionNoDesc(String recordId);

    Optional<RecordVersion> findByRecordIdAndVersionNo(String recordId, Long versionNo);
}
